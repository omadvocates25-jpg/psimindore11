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
  'paint':'painter', 'farm':'farmer agriculture किसान'
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
