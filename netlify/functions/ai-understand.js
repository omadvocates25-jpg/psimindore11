// Patidar AI ke sawaal ko SIRF samajhne (classify karne) ke liye — Groq (free tier) ko bhejta hai.
// Yeh function KABHI khud koi jawab nahi banata / nahi bhejta — sirf {category, keywords, place, blood_group}
// jaisa chhota structured hint deta hai, jise app.js apne hi rule-based handlers ko route karne ke liye
// use karta hai. Groq key sirf yahan (server-side env var) rehti hai, browser mein kabhi nahi jaati.

const CATEGORIES = ['business','hospital','dharamshala','blood','village_info','count','distance','nearest','news','events','greeting','shaadi','property','unknown'];

const SYSTEM_PROMPT = `Tum "Patidar AI" (Patidar Samaj Indore community app) ke liye ek intent classifier ho.
Tum USER KE SAWAAL KA JAWAB KABHI NAHI DETE — sirf classify karte ho ki sawaal kis category ka hai.
Sirf STRICT JSON return karo, kuch aur text nahi, isi shape mein:
{"category": "<ek category neeche list se>", "keywords": "<chhota normalized search term/business type, ya null>", "place": "<jagah/gaanv/area ka naam agar bola ho, ya null>", "blood_group": "<jaise O+/B-/AB+ agar bola ho, ya null>"}

Categories:
- business: kisi dukaan/service/professional (electrician, doctor, tailor, kirana, food/restaurant, mistri, etc.) ki zaroorat hai
- hospital: hospital ke baare mein pooch raha hai
- dharamshala: dharamshala/rukne ki jagah ke baare mein pooch raha hai
- blood: blood donor ke baare mein pooch raha hai
- village_info: koi gaanv kis tehsil/jile mein hai, ya kisi tehsil/jile mein kaunse gaanv aate hain, ya gaanv ke mandir/dharamshala/local jaankari ke baare mein
- count: kitne members/log registered hain (total ya kisi gaanv ke) — sirf ginti, personal detail nahi
- distance: do gaanv ke beech doori
- nearest: sabse paas/nearest hospital/dharamshala/business kisi jagah ke paas
- news: samaj ki news
- events: samaj ke events/karyakram
- greeting: sirf hi/hello/namaste jaisa
- shaadi: shaadi/vivaah/matrimony se related (iska jawab mat do, sirf classify karo)
- property: property/makan/kiraye se related (iska jawab mat do, sirf classify karo)
- unknown: upar mein se kuch fit nahi hota, ya personal/unrelated/samaj se bahar ka sawaal hai

Agar sure na ho to "unknown" do. Kabhi kisi ka naam/phone number apne output mein mat likho.`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
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
        temperature: 0,
        max_tokens: 150
      }),
      signal: ctrl.signal
    });
    clearTimeout(timer);

    if (!resp.ok) {
      return { statusCode: 200, body: JSON.stringify({ category: null }) };
    }
    const data = await resp.json();
    const raw = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!raw) return { statusCode: 200, body: JSON.stringify({ category: null }) };

    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) { return { statusCode: 200, body: JSON.stringify({ category: null }) }; }

    const category = CATEGORIES.includes(parsed.category) ? parsed.category : null;
    const out = {
      category,
      keywords: typeof parsed.keywords === 'string' ? parsed.keywords.slice(0, 100) : null,
      place: typeof parsed.place === 'string' ? parsed.place.slice(0, 100) : null,
      blood_group: typeof parsed.blood_group === 'string' ? parsed.blood_group.slice(0, 5) : null
    };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(out) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ category: null }) };
  }
};
