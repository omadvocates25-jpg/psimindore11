const {onRequest} = require('firebase-functions/v2/https');
const {defineSecret} = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const crypto = require('crypto');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const WHATSAPP_TOKEN = defineSecret('WHATSAPP_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = defineSecret('WHATSAPP_PHONE_NUMBER_ID');
const WHATSAPP_VERIFY_TOKEN = defineSecret('WHATSAPP_VERIFY_TOKEN');
const WHATSAPP_APP_SECRET = defineSecret('WHATSAPP_APP_SECRET');

const SITE_URL = 'https://psimindore.com';

// यही synonyms website के "आपको कौन चाहिए?" search वाले हैं — दोनों जगह एक जैसा result मिले, इसलिए duplicate रखा है
// (functions/ browser वाले app.js को require नहीं कर सकता, उसमें DOM references हैं)
const SEARCH_SYNONYMS = {
  'dr':'doctor', 'doc':'doctor', 'adv':'advocate lawyer', 'lawyer':'advocate legal',
  'ca':'accountant', 'cs':'accountant', 'eng':'engineer', 'engg':'engineer',
  'govt':'government', 'sarkari':'government job', 'kisan':'farmer agriculture',
  'elec':'electrician electronics', 'electric':'electrician electronics',
  'plum':'plumber', 'carp':'carpenter', 'mistri':'mason carpenter',
  'raj':'mason', 'darji':'tailor', 'nai':'barber salon',
  'cook':'cook caterer restaurant food', 'catering':'cook caterer food',
  'med':'medical pharmacy', 'medicine':'medical pharmacy', 'pharma':'medical pharmacy',
  'mobile':'mobile electronics', 'phone':'mobile electronics',
  'photo':'photographer', 'video':'videographer', 'camera':'photographer videographer',
  'comp':'computer it', 'computer':'computer it', 'it':'computer it work',
  'gym':'fitness gym trainer', 'fitness':'gym fitness trainer',
  'property':'property dealer real estate', 'dealer':'property dealer',
  'kirana':'kirana general store', 'grocery':'kirana general store',
  'sabji':'vegetable fruit sabji', 'fruit':'sabji fruit vendor',
  'jewel':'jewellery jeweller', 'sona':'jewellery jeweller',
  'cloth':'textiles garments cloth', 'kapda':'textiles garments cloth',
  'shoe':'footwear', 'chappal':'footwear',
  'weld':'welder fabricator', 'tent':'tent house event',
  'dairy':'dairy milk', 'doodh':'dairy milk',
  'restaurant':'restaurant food hotel', 'hotel':'restaurant food hotel',
  'legal':'legal advocate ca consultant', 'consultant':'legal consultant',
  'teacher':'teacher coaching education', 'coach':'coaching teacher education tuition',
  'tuition':'teacher coaching education', 'school':'teacher education coaching',
  'transport':'transport logistics driver', 'logistics':'transport logistics',
  'construction':'construction builder', 'builder':'construction builder real estate',
  'beauty':'beauty salon', 'parlour':'beauty salon', 'salon':'beauty salon',
  'import':'import export trading', 'export':'import export trading',
  'factory':'manufacturing factory', 'manufacturing':'manufacturing factory',
  'auto':'automobile garage', 'garage':'automobile garage', 'mechanic':'automobile garage',
  'tractor':'tractor machinery', 'machine':'tractor machinery',
  'paint':'painter', 'farm':'farmer agriculture किसान',
  // ---- रोज़मर्रा की ज़रूरत/तकलीफ़ बोलने पर सही business मिले (जैसे "bhukh lagi" → खाना/restaurant) ----
  'bhukh':'food restaurant hotel caterer khana', 'bhookh':'food restaurant hotel caterer khana',
  'khana':'food restaurant hotel caterer', 'nashta':'restaurant hotel food', 'bhoj':'caterer food restaurant',
  'pyaas':'water cold drink', 'pani':'water',
  'bimar':'doctor medical hospital clinic', 'ilaj':'doctor medical hospital clinic', 'dawai':'medical pharmacy doctor',
  'ghar banwana':'construction builder', 'makan banwana':'construction builder',
  'naukri':'job government employment', 'kaam chahiye':'job employment',
  'paisa chahiye':'loan finance banking', 'loan':'loan finance banking', 'udhar':'loan finance banking',
  'padhna':'teacher coaching education tuition', 'padhai':'teacher coaching education tuition',
  'safai':'cleaning housekeeping', 'rishta':'shaadi marriage matrimony vivah', 'shaadi karni':'shaadi marriage matrimony',
  'ghumna':'travel tour transport', 'yatra':'travel tour transport',
  'xerox':'printing xerox stationery', 'print':'printing xerox stationery'
};

function today(){ return new Date().toISOString().slice(0,10); }
function esc(s){ return (s||'').toString().trim(); }

function expandSynonyms(q){
  let extra = '';
  Object.keys(SEARCH_SYNONYMS).forEach(k=>{ if(q.includes(k)) extra += ' '+SEARCH_SYNONYMS[k]; });
  return q + extra;
}

function isBizPromoActive(m){
  return m && m.biz_promo_status === 'active' && (m.biz_promo_until || '0000-00-00') >= today();
}

// members collection से business list निकालना — website के allBusinesses() जैसा ही mapping
function toBusiness(m){
  if (!m.business_name) return null;
  return {
    name: m.business_name,
    type: (m.business_type === 'Other' && m.business_type_other) ? m.business_type_other : (m.business_type || 'Business'),
    place: m.business_place || m.present_city || '',
    village: m.home_village || '',
    city: m.present_city || '',
    phone: m.business_phone || m.phone || '',
    promoted: isBizPromoActive(m)
  };
}

async function searchBusinesses(query){
  const snap = await db.collection('members').where('status', '==', 'approved').get();
  const q = expandSynonyms(query.trim().toLowerCase());
  const qWords = q.split(/\s+/).filter(Boolean);

  const scored = [];
  snap.forEach(doc => {
    const b = toBusiness(doc.data());
    if (!b) return;
    const hay = (b.type + ' ' + b.name + ' ' + b.place + ' ' + b.village + ' ' + b.city).toLowerCase();
    let score = 0;
    if (hay.includes(q)) score += 10;
    qWords.forEach(w => { if (hay.includes(w)) score += 1; });
    if (score > 0) scored.push({b, score});
  });

  scored.sort((x, y) => (y.b.promoted ? 1 : 0) - (x.b.promoted ? 1 : 0) || y.score - x.score);
  return scored.slice(0, 7).map(x => x.b);
}

function buildReply(query, results){
  if (!query) {
    return 'नमस्ते 🙏 PSIM Directory में आपका स्वागत है।\n\nजो चाहिए वो + इलाका लिखकर भेजो, जैसे:\n"Electrician Vijay Nagar" या "Plumber"\n\nपूरी directory: ' + SITE_URL;
  }
  if (!results.length) {
    return 'माफ़ कीजिए, "' + query + '" के लिए कोई match नहीं मिला।\n\nधंधा/काम + इलाका लिखकर दोबारा try करें, या पूरी list यहाँ देखें: ' + SITE_URL;
  }
  const lines = results.map((b, i) => {
    const tag = b.promoted ? ' ⭐' : '';
    const place = b.place || b.village || b.city || '';
    return (i + 1) + '. ' + b.name + tag + '\n   ' + b.type + (place ? ' | ' + place : '') + '\n   📞 ' + b.phone;
  });
  return '🔍 "' + query + '" के लिए मिले:\n\n' + lines.join('\n\n') + '\n\nपूरी list और details: ' + SITE_URL;
}

async function sendWhatsAppText(to, body){
  const url = 'https://graph.facebook.com/v20.0/' + WHATSAPP_PHONE_NUMBER_ID.value() + '/messages';
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + WHATSAPP_TOKEN.value(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body }
    })
  });
  if (!resp.ok) {
    logger.error('WhatsApp send failed', resp.status, await resp.text());
  }
}

// Meta हर webhook request "X-Hub-Signature-256" header में भेजता है — इससे verify करते हैं
// कि request सच में Meta से आई है, कोई और हमारे number से fake message नहीं भिजवा सकता
function verifySignature(req){
  const signature = req.get('X-Hub-Signature-256') || '';
  const expected = 'sha256=' + crypto
    .createHmac('sha256', WHATSAPP_APP_SECRET.value())
    .update(req.rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch (e) {
    return false;
  }
}

// एक ही message पर Meta दो-तीन बार webhook retry कर सकता है (timeout वगैरह की वजह से) —
// इससे duplicate reply ना जाए, message id एक बार process होने पर record कर लेते हैं
async function alreadyProcessed(messageId){
  const ref = db.collection('wa_processed').doc(messageId);
  const doc = await ref.get();
  if (doc.exists) return true;
  await ref.set({ at: admin.firestore.FieldValue.serverTimestamp() });
  return false;
}

exports.whatsappWebhook = onRequest(
  { secrets: [WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET], region: 'asia-south1' },
  async (req, res) => {
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN.value()) {
        return res.status(200).send(challenge);
      }
      return res.sendStatus(403);
    }

    if (req.method === 'POST') {
      if (!verifySignature(req)) {
        logger.warn('Invalid WhatsApp webhook signature');
        return res.sendStatus(401);
      }
      try {
        const entry = req.body.entry && req.body.entry[0];
        const change = entry && entry.changes && entry.changes[0];
        const value = change && change.value;
        const msg = value && value.messages && value.messages[0];
        if (!msg || msg.type !== 'text') {
          return res.sendStatus(200); // status updates / non-text messages — ignore
        }
        if (await alreadyProcessed(msg.id)) {
          return res.sendStatus(200);
        }

        const from = msg.from;
        const query = esc(msg.text && msg.text.body);
        const results = query ? await searchBusinesses(query) : [];
        const reply = buildReply(query, results);
        await sendWhatsAppText(from, reply);
      } catch (e) {
        logger.error('whatsappWebhook error', e);
      }
      return res.sendStatus(200);
    }

    return res.sendStatus(405);
  }
);

// ============================================================================
// Reference से Register (non-OTP onboarding)
//
// Client-side "members" create rule Firebase Auth (real OTP) माँगता है, isliye
// yeh flow client se seedha Firestore likh nahi sakta — Admin SDK (jo rules
// bypass karta hai) yahan zaroori hai. Yahi function दोनों काम करता है:
//  1. referral_preapprovals में registrant ka phone dhundhna (kisi member ne
//     pehle se approve kar rakha hai kya)
//  2. members doc banana — match mila to seedha 'approved' + custom auth token
//     (client isse auth.signInWithCustomToken() se turant login kar leta hai),
//     warna 'pending' (aaj jaisa admin-review wala normal flow)
// ============================================================================
const MEMBER_FIELD_KEYS = [
  'name','surname','phone','email','gender','privacy','age','work_details',
  'marital_status','blood_group','blood_donor','home_village','home_tehsil','home_district',
  'home_district_other','home_state','home_pincode','home_police_station','present_address',
  'present_city','present_tehsil','present_district','present_district_other','present_state',
  'present_pincode','present_police_station','business_name','business_type','business_type_other',
  'business_place','business_phone','business_gmap','business_details'
];

function fmtName(s){ return (s||'').toString().trim().replace(/\s+/g,' ').toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase()); }
function onlyDigits(s){ return (s||'').toString().replace(/[^0-9]/g,''); }

// यहाँ जानबूझकर सिर्फ जाने-पहचाने text fields ही body से उठाए हैं (photo/pic URLs नहीं) —
// isse attacker arbitrary field (जैसे status:'approved') inject नहीं कर सकता, वो हम खुद set करते हैं
function sanitizeMemberData(body, phone){
  const d = {};
  MEMBER_FIELD_KEYS.forEach(k => { d[k] = esc((body && body[k]) || '').slice(0, 500); });
  d.name = fmtName(d.name);
  d.surname = fmtName(d.surname);
  d.home_village = fmtName(d.home_village);
  d.present_city = fmtName(d.present_city);
  d.phone = phone;
  d.business_phone = onlyDigits(d.business_phone).slice(0, 10);
  d.profile_pic = ''; d.business_pic1 = ''; // photo upload sirf logged-in flow me hi allowed
  return d;
}

exports.referenceRegister = onRequest({ region: 'asia-south1', cors: true }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const body = req.body || {};
    const phone = onlyDigits(body.phone).slice(0, 10);
    if (phone.length !== 10) return res.status(400).json({ error: 'invalid_phone' });

    const d = sanitizeMemberData(body, phone);
    if (!d.name || !d.surname || !d.home_village) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    const existing = await db.collection('members').where('phone', '==', phone).limit(1).get();
    if (!existing.empty) return res.status(400).json({ error: 'already_registered' });

    const preSnap = await db.collection('referral_preapprovals').where('phone', '==', phone).limit(1).get();
    let approved = false, token = null, referrerPhone = null;
    if (!preSnap.empty) {
      approved = true;
      const preDoc = preSnap.docs[0];
      referrerPhone = preDoc.data().referrerPhone || null;
      await preDoc.ref.update({ usedAt: today() });
    }

    d.status = approved ? 'approved' : 'pending';
    d.phoneVerified = false; // OTP se verify nahi hua — referrer ki responsibility par based
    d.referredBy = referrerPhone;
    d.createdAt = today();
    await db.collection('members').add(d);

    if (approved) {
      token = await admin.auth().createCustomToken(phone, { phone_number: '+91' + phone });
    }
    return res.status(200).json({ approved, token });
  } catch (e) {
    logger.error('referenceRegister error', e);
    return res.status(500).json({ error: 'server_error' });
  }
});
