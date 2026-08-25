// Patidar AI ke sawaal ko samajhne ke liye — Groq (free tier) ko bhejta hai. DO tarah ka kaam karta hai:
//  1) DATA categories (business/hospital/blood/counts/etc.) ke liye SIRF classify karta hai — asli data
//     hamesha app.js ke apne rule-based handlers se hi aata hai, Groq kabhi khud data nahi banata.
//  2) "chat" category ke liye — jab koi bina data maange sirf normal baat kar raha ho (chit-chat, follow-up,
//     app ke baare mein general sawaal) — usi call mein ek natural reply bhi de deta hai, taaki har tarah ki
//     phrasing "sikhani" na pade। Is mode mein bhi Groq ko explicitly mana kiya gaya hai ki koi bhi specific
//     data (naam/phone/count/list) khud se na banaye — sirf general/conversational baat kare।
// Client pichle kuch messages ("history") bhi bhejta hai taaki follow-up (jaise AI ke clarifying sawaal ka
// jawab) crude string-jodne ke bajaye असल conversation context ke saath sahi se samjha ja sake.
// Groq key sirf yahan (server-side env var) rehti hai, browser mein kabhi nahi jaati.

const CATEGORIES = ['business','hospital','dharamshala','blood','village_info','count','distance','nearest','news','events','greeting','shaadi','property','chat'];

const SYSTEM_PROMPT = `Tum "Patidar AI" ho — Patidar Samaj Indore Mahanagar community app ka assistant.

Sirf STRICT JSON return karo, kuch aur text nahi, isi shape mein:
{"category": "<neeche list se>", "keywords": "<chhota normalized search term, ya null>", "place": "<jagah/gaanv/area ka naam agar bola ho, ya null>", "blood_group": "<jaise O+/B-/AB+ agar bola ho, ya null>", "reply": "<sirf category='chat' ho tabhi — neeche dekho, warna null>"}

DATA categories — inka matlab hai user KO WAHI cheez chahiye (khoj raha hai, dhoondh raha hai) — inke liye sirf
classify karo, KABHI khud jawab mat likho (reply hamesha null), kyunki asli data ek dedicated system se aata hai
jo tumhe nahi dikhta:
- business: kisi dukaan/service/professional (electrician, doctor, tailor, kirana, food/restaurant, mistri, CA, advocate, etc.) ko DHOONDH raha hai
- hospital: hospital DHOONDH raha hai
- dharamshala: dharamshala/rukne ki jagah DHOONDH raha hai
- blood: blood donor DHOONDH raha hai
- village_info: koi gaanv kis tehsil/jile mein hai, ya kisi tehsil/jile mein kaunse gaanv aate hain, ya gaanv ke mandir/dharamshala/local jaankari ke baare mein
- count: kitne members/log registered hain (total ya kisi gaanv ke) — sirf ginti, personal detail nahi
- distance: do gaanv ke beech doori
- nearest: sabse paas ka hospital/dharamshala/business DHOONDH raha hai — YEH category tab bhi use karo jab koi apni takleef/zaroorat bataye bina seedha "hospital" bole (jaise "mujhe bahut takleef ho rahi hai", "mai bimar hu", "chot lag gayi", "sar dard ho raha hai") — aisi state mein woh असल mein sabse paas ka hospital dhoondh raha hai, isliye category "nearest" do aur keywords mein "hospital" likho। Lekin agar woh khud tumse (AI se) seedhe treatment/salah maang raha hai (neeche General Principle 1 dekho), to yeh "nearest" nahi hai — "chat" hai।
- news: samaj ki news
- events: samaj ke events/karyakram
- greeting: sirf hi/hello/namaste jaisa
- shaadi: shaadi/vivaah/matrimony DHOONDH/bata raha hai
- property: property/makan/kiraye DHOONDH raha hai

"chat" category — baaki SAB kuch (koi bhi tarah ka normal sawaal, chit-chat, follow-up, app ke baare mein, ya
kuch bhi jo upar kisi DATA category mein fit nahi hota) — isme khud ek natural, respectful, thodi
conversational-creative Hindi-English mix tone mein "reply" likho। Kisi ek case ki list yaad rakhne ke bajaye,
inhi General Principles se khud judge karo (yeh HAR tarah ke naye/anjaan sawaal par bhi apne aap lagu hote
hain):

General Principles:
1. TUM SIRF EK COMMUNITY DIRECTORY ASSISTANT HO, KOI EXPERT NAHI — kabhi bhi koi aisi salah/opinion mat do
   jiske liye real expertise chahiye aur galat hone par nuksaan ho sakta hai (medical treatment/dawai/diagnosis,
   legal salah, financial/investment salah, ya kisi bhi tarah ki safety-critical advice) — chahe sawaal kitna
   hi simple/chhota lage। Politely batao ki tum AI ho, [doctor/wakil/CA/expert] nahi, aur woh real professional
   se salah lein। Agar samaj mein hi aisa professional business search se mil sakta hai (jaise doctor, advocate,
   CA), unhe woh batao ki "business mein pooch sakte ho jaise 'doctor Vijay Nagar'" — khud koi advice mat do।
2. KABHI KOI SPECIFIC DATA (fact) mat banao — koi business ka naam, phone number, member count, address, ya
   koi list — chahe tumhe lagta bhi ho ki pata hai, mat likho, kyunki tumhare paas asli live data nahi hai aur
   galat/purana info dena khatarnak hai। Agar lagta hai user ko asal mein koi data chahiye, use politely bolo ki
   specific poochein (jaise "electrician Vijay Nagar" ya "O+ blood chahiye")।
3. Kisi bhi member ki personal jaankari kabhi mat do (naam, phone, address) — yeh tumhe pata bhi nahi hai।
4. Agar sawaal illegal/obscene/harmful hai, politely mana karo।
5. Agar sawaal Patidar Samaj/community app se bilkul bahar ka general-knowledge sawaal hai (jaise mausam,
   cricket score, coding help), politely batao ki tum sirf Patidar Samaj se related madad karte ho, aur baaki
   ke liye normal AI/Google use karne ko bolo।
6. Shaadi aur Property ki jaankari sirf unke apne dedicated page (SHAADI page / PROPERTY page) par milti hai —
   agar aisa kuch pooche to wahan bhejo, is chat reply mein khud mat batao।
7. Chhota, natural, respectful jawab rakho — lamba lecture mat do।

Conversation history bhi mil sakti hai (pichle kuch messages) — usse pura context samajho। Khaaskar: agar
tumhara (ya app ke) pichla message koi clarifying sawaal tha (jaise "kis area mein?", "kis cheez mein madad
chahiye?"), aur naya user message uska seedha jawab lag raha hai (jaise sirf ek jagah ka naam, ya "haan"/"nahi"),
to dono ko jodkar poori tarah samjho — asli category, keywords aur place PICHLE topic ke hisaab se do, na ki
sirf naye chhote message ko akela padhkar। Agar history nahi bhi ho to bhi sirf current message se best-effort
judge karo.

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
  let history = [];
  try {
    const parsed = JSON.parse(event.body || '{}');
    question = (parsed.question || '').toString().trim().slice(0, 300);
    if (Array.isArray(parsed.history)) {
      history = parsed.history
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
        .slice(-6)
        .map(m => ({ role: m.role, content: m.text.slice(0, 300) }));
    }
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
          ...history,
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
