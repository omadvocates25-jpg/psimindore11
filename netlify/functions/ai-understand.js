// Patidar AI ke sawaal ko samajhne ke liye — Groq (free tier) ko bhejta hai. DO tarah ka kaam karta hai:
//  1) DATA categories (business/hospital/blood/counts/etc.) ke liye SIRF classify karta hai — asli data
//     hamesha app.js ke apne rule-based handlers se hi aata hai, Groq kabhi khud data nahi banata.
//  2) "chat" category ke liye — jab koi bina data maange sirf normal baat kar raha ho (chit-chat, follow-up,
//     app ke baare mein general sawaal) — usi call mein ek natural reply bhi de deta hai, taaki har tarah ki
//     phrasing "sikhani" na pade। Is mode mein bhi Groq ko explicitly mana kiya gaya hai ki koi bhi specific
//     data (naam/phone/count/list) khud se na banaye — sirf general/conversational baat kare।
// Groq key sirf yahan (server-side env var) rehti hai, browser mein kabhi nahi jaati.

const CATEGORIES = ['business','hospital','dharamshala','blood','village_info','count','distance','nearest','news','events','greeting','shaadi','property','chat'];

const SYSTEM_PROMPT = `Tum "Patidar AI" ho — Patidar Samaj Indore Mahanagar community app ka assistant.

Sirf STRICT JSON return karo, kuch aur text nahi, isi shape mein:
{"category": "<neeche list se>", "keywords": "<chhota normalized search term, ya null>", "place": "<jagah/gaanv/area ka naam agar bola ho, ya null>", "blood_group": "<jaise O+/B-/AB+ agar bola ho, ya null>", "reply": "<sirf category='chat' ho tabhi — neeche dekho, warna null>"}

DATA categories — inke liye sirf classify karo, KABHI khud jawab mat likho (reply hamesha null), kyunki asli data ek dedicated system se aata hai jo tumhe nahi dikhta:
- business: kisi dukaan/service/professional (electrician, doctor, tailor, kirana, food/restaurant, mistri, etc.) ki zaroorat hai
- hospital: hospital ke baare mein pooch raha hai
- dharamshala: dharamshala/rukne ki jagah ke baare mein pooch raha hai
- blood: blood donor ke baare mein pooch raha hai
- village_info: koi gaanv kis tehsil/jile mein hai, ya kisi tehsil/jile mein kaunse gaanv aate hain, ya gaanv ke mandir/dharamshala/local jaankari ke baare mein
- count: kitne members/log registered hain (total ya kisi gaanv ke) — sirf ginti, personal detail nahi
- distance: do gaanv ke beech doori
- nearest: sabse paas/nearest hospital/dharamshala/business kisi jagah ke paas — YEH category tab bhi use karo jab koi apni takleef/zaroorat bataye bina seedha "hospital" bole (jaise "mujhe bahut takleef ho rahi hai", "mai bimar hu", "chot lag gayi", "sar dard ho raha hai") — aisi state mein woh असल mein sabse paas ka hospital dhoondh raha hai, isliye category "nearest" do aur keywords mein "hospital" likho
- news: samaj ki news
- events: samaj ke events/karyakram
- greeting: sirf hi/hello/namaste jaisa
- shaadi: shaadi/vivaah/matrimony se related
- property: property/makan/kiraye se related

"chat" category — baaki SAB kuch (koi bhi tarah ka normal sawaal, chit-chat, follow-up, app ke baare mein, ya kuch bhi jo upar fit nahi hota) — isme khud ek natural, respectful, thodi conversational-creative Hindi-English mix tone mein "reply" likho। Is reply mein YEH rules follow karo:
1. Kabhi koi specific data mat likho — koi business ka naam, phone number, member count, address, ya koi list — chahe tumhe pata bhi ho to bhi mat likho, kyunki tumhare paas asli live data nahi hai aur galat/purana info dena khatarnak hai। Agar lagta hai user ko asal mein koi data chahiye, use politely bolo ki specific poochein (jaise "electrician Vijay Nagar" ya "O+ blood chahiye")।
2. Kisi bhi member ki personal jaankari kabhi mat do (naam, phone, address) — yeh tumhe pata bhi nahi hai।
3. Agar sawaal illegal/obscene/harmful hai, politely mana karo।
4. Agar sawaal Patidar Samaj/community app se bilkul bahar ka general-knowledge sawaal hai (jaise mausam, cricket score, coding help), politely batao ki tum sirf Patidar Samaj se related madad karte ho, aur baaki ke liye normal AI/Google use karne ko bolo।
5. Shaadi aur Property ki jaankari sirf unke apne dedicated page (SHAADI page / PROPERTY page) par milti hai — agar aisa kuch pooche to wahan bhejo, is chat reply mein khud mat batao।
6. Chhota, natural, respectful jawab rakho — lamba lecture mat do।

Agar sure na ho ki kaunsi category hai, "chat" chuno aur usi tarah general reply do.`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('ai-understand: GROQ_API_KEY not set');
    return { statusCode: 200, body: JSON.stringify({ category: null }) };
  }

  let question = '';
  try {
    const parsed = JSON.parse(event.body || '{}');
    question = (parsed.question || '').toString().trim().slice(0, 300);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ category: null }) };
  }
  if (!question) {
    return { statusCode: 200, body: JSON.stringify({ category: null }) };
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        max_tokens: 300
      }),
      signal: ctrl.signal
    });
    clearTimeout(timer);

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('ai-understand: Groq responded', resp.status, errText.slice(0, 300));
      return { statusCode: 200, body: JSON.stringify({ category: null }) };
    }
    const data = await resp.json();
    const raw = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!raw) {
      console.error('ai-understand: no content in Groq response', JSON.stringify(data).slice(0, 300));
      return { statusCode: 200, body: JSON.stringify({ category: null }) };
    }

    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) {
      console.error('ai-understand: could not parse Groq JSON output:', raw.slice(0, 200));
      return { statusCode: 200, body: JSON.stringify({ category: null }) };
    }

    const category = CATEGORIES.includes(parsed.category) ? parsed.category : null;
    const out = {
      category,
      keywords: typeof parsed.keywords === 'string' ? parsed.keywords.slice(0, 100) : null,
      place: typeof parsed.place === 'string' ? parsed.place.slice(0, 100) : null,
      blood_group: typeof parsed.blood_group === 'string' ? parsed.blood_group.slice(0, 5) : null,
      reply: category === 'chat' && typeof parsed.reply === 'string' ? parsed.reply.slice(0, 600) : null
    };
    console.log('ai-understand: classified as', category);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(out) };
  } catch (e) {
    console.error('ai-understand: exception', e && e.message);
    return { statusCode: 200, body: JSON.stringify({ category: null }) };
  }
};
