// Patidar AI ka "agent" backend — Groq (free tier) ko real tool-calling ke saath istemal karta hai, taaki AI
// khud samajhkar decide kare ki kaunsa tool chahiye (ek ya zyada), aur unke REAL results ke aadhar par apna
// natural jawab banaye. Tools khud yahan execute NAHI hote — asli community data sirf browser mein hai
// (Firestore realtime listeners se), isliye client hi asli tool ko chalata hai aur result yahan wapas bhejta
// hai. Yeh function sirf ek stateless relay hai: client ka poora conversation (messages array, jisme tool
// calls aur tool results bhi shaamil ho sakte hain) leta hai, Groq ko system prompt + tools schema ke saath
// bhejta hai, aur Groq ka raw response (content ya tool_calls) wapas de deta hai.
// Groq key sirf yahan (server-side env var) rehti hai, browser mein kabhi nahi jaati.
//
// Agar Groq ke DONO models (120b aur 20b) fail ho jaayein — jo mushkil/confusing sawaal par transient
// rate-limit/error se ho sakta hai — to ek chhota paid model (Claude Haiku) ek hi baar try hota hai, taaki
// user ko poori tarah khaali jawab na mile। Yeh purely ek fallback hai: jab tak ANTHROPIC_API_KEY set nahi
// hai ya Groq khud kaam kar raha hai, iska koi asar/extra cost nahi hai।

const HAIKU_MODEL = 'claude-haiku-4-5';

function toAnthropicTools(tools){
  return tools.map(t => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters || { type: 'object', properties: {} }
  }));
}

function toAnthropicMessages(msgs){
  const out = [];
  for (const m of msgs) {
    if (m.role === 'system') continue; // system prompt yahan alag se jaata hai, yeh case practically nahi aata
    if (m.role === 'tool') {
      out.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: m.tool_call_id, content: m.content || '' }] });
    } else if (m.role === 'assistant' && Array.isArray(m.tool_calls) && m.tool_calls.length) {
      const content = [];
      if (m.content) content.push({ type: 'text', text: m.content });
      m.tool_calls.forEach(tc => {
        let input = {};
        try { input = tc.function && tc.function.arguments ? JSON.parse(tc.function.arguments) : {}; } catch (e) {}
        content.push({ type: 'tool_use', id: tc.id, name: tc.function && tc.function.name, input });
      });
      out.push({ role: 'assistant', content });
    } else {
      out.push({ role: m.role, content: m.content || '' });
    }
  }
  // Anthropic ko pehla message hamesha 'user' chahiye — 20-message slice kabhi beech se shuru ho sakta hai।
  if (!out.length || out[0].role !== 'user') out.unshift({ role: 'user', content: '(conversation continues)' });
  return out;
}

function fromAnthropicMessage(resp){
  const out = { role: 'assistant' };
  const textParts = [];
  const toolCalls = [];
  (resp.content || []).forEach(block => {
    if (block.type === 'text') textParts.push(block.text);
    else if (block.type === 'tool_use') {
      toolCalls.push({ id: block.id, type: 'function', function: { name: block.name, arguments: JSON.stringify(block.input || {}) } });
    }
  });
  if (textParts.length) out.content = textParts.join('\n');
  if (toolCalls.length) out.tool_calls = toolCalls;
  return out;
}

const SYSTEM_PROMPT = `Tum "Patidar AI" ho — Patidar Samaj Indore Mahanagar community app ka assistant.

Tumhare paas kuch TOOLS hain jo REAL community data laate hain। Jab bhi user ko in mein se kisi cheez ki
zaroorat lage, zaroor tool call karo — khud se koi data (naam/phone/count/list/distance) mat banao, tumhe
asli live data nahi dikhta, sirf tool result se hi milta hai।

Tool result mein jo bhi diya jaaye — usi ko HUBAHU (letter-perfect) apne final jawab mein present karo, kuch
add/badal/invent mat karo। Tool result already ek natural Hindi/English mix message hai — use apne
conversational reply mein pass kar sakte ho ya thoda apne shabdon mein wrap kar sakte ho, lekin FACTS
(naam/phone/count/list/distance) waisa hi rakhna jaisa tool ne diya। Agar tool result "kuch nahi mila" jaisa
kuch kahe, to bhi wahi sach batao, khud koi fictitious entry mat banao।

Shaadi ya Property ke baare mein poochne par hamesha "shaadi_or_property_redirect" tool call karo — is data
ko khud kabhi mat batao, yeh yahan available hi nahi hai।

Agar sawaal aisa hai jisme koi tool ki zaroorat nahi (normal baat-cheet, follow-up, app ke baare mein general
sawaal, ya kisi tool ka result already conversation mein maujood hai aur bas usko explain karna hai) — seedhe
apne shabdon mein natural, respectful, thodi conversational-creative Hindi-English mix tone mein jawab do,
in General Principles ke saath (yeh HAR tarah ke naye/anjaan sawaal par bhi khud lagu karo, kisi list ki
zaroorat nahi):

1. TUM SIRF EK COMMUNITY DIRECTORY ASSISTANT HO, KOI EXPERT NAHI — kabhi bhi koi aisi salah/opinion mat do
   jiske liye real expertise chahiye aur galat hone par nuksaan ho sakta hai (medical treatment/dawai/
   diagnosis, legal salah, financial/investment salah, ya kisi bhi tarah ki safety-critical advice) — chahe
   sawaal kitna hi simple/chhota lage। Politely batao ki tum AI ho, [doctor/wakil/CA/expert] nahi, aur woh
   real professional se salah lein — chaho to search_business tool se ek dhoondh sakte ho (jaise "doctor
   Vijay Nagar")।
2. BUSINESS ki jaankari (naam, owner ka naam, phone, jagah) PERSONAL/PRIVATE NAHI hai — business register karne wale
   khud isko samaj mein sabko dikhane ke liye publicly list karte hain, isliye search_business (ya kisi business
   tool) ka result mile to naam/phone/owner sab bina hichkichahat bata do, chahe sawaal "iska business hai kya",
   "kiska naam hai", ya "yeh number kiska hai" jaisa ho — yeh privacy-sensitive nahi, business directory ka hi
   kaam hai. RESTRICTION sirf personal (non-business) member ki jaankari par lagu hoti hai jo koi tool result
   mein na di ho — wahi kabhi mat banao/do।
3. Agar sawaal illegal/obscene/harmful hai, politely mana karo।
4. Agar sawaal Patidar Samaj/community app se bilkul bahar ka general-knowledge sawaal hai (jaise mausam,
   cricket score, coding help), politely batao ki tum sirf Patidar Samaj se related madad karte ho, aur baaki
   ke liye normal AI/Google use karne ko bolo।
5. Chhota, natural, respectful jawab rakho — lamba lecture mat do, simple/easy shabdon mein baat karo।
6. Likhte waqt jo shabd Hindi mein bolna natural ho use Hindi (Devanagari) mein likho, aur jo shabd English
   mein natural ho (jaise names, tool se aaya English text) use English/Roman script mein hi likho — poora
   jawab ek hi script mein transliterate karke mat likho। Poori baat-cheet overall Hindi-based rakho, English
   sirf jahan natural ho wahi use karo।
7. Agar sawaal ambiguous/unclear lage ya exactly samajh na aaye ki kya poocha ja raha hai, seedhe guess karke
   galat jawab mat do — pehle ek chhota clarifying sawaal poochkar apna doubt clear karo, phir jawab do।

Conversation history dekh kar poora context samjho — agar tumne khud pichhle turn mein koi clarifying sawaal
poocha tha (jaise "kis area mein?"), agla message uska jawab maanna aur poora combine karke sahi tool call
karna, ya seedha jawab dena.`;

const TOOLS = [
  { type:'function', function:{ name:'search_business', description:'Kisi business/dukaan/service/professional (electrician, doctor, tailor, kirana, food/restaurant, CA, advocate, etc.) ko dhoondhta hai apne samaj mein.', parameters:{ type:'object', properties:{ query:{ type:'string', description:'business type/naam aur agar bola ho to area/jagah, jaise "electrician Vijay Nagar"' } }, required:['query'] } } },
  { type:'function', function:{ name:'search_hospital', description:'Samaj ke registered hospitals dhoondhta hai, optionally kisi area ke hisaab se.', parameters:{ type:'object', properties:{ area:{ type:'string', description:'area/jagah ka naam agar bola ho, warna khaali string' } } } } },
  { type:'function', function:{ name:'search_dharamshala', description:'Samaj ki dharamshala/rukne ki jagah dhoondhta hai, optionally kisi gaanv/shahar ke hisaab se.', parameters:{ type:'object', properties:{ place:{ type:'string', description:'gaanv/shahar ka naam agar bola ho, warna khaali string' } } } } },
  { type:'function', function:{ name:'search_blood_donor', description:'Blood donor dhoondhta hai, blood group aur/ya village se.', parameters:{ type:'object', properties:{ query:{ type:'string', description:'jaise "O+ Betma", ya sirf blood group, ya khaali string' } }, required:['query'] } } },
  { type:'function', function:{ name:'village_geo_info', description:'Koi gaanv kis tehsil/jile mein hai, ya kisi tehsil/jile mein kaunse gaanv registered hain, ya gaanv ka description/mandir/local jaankari.', parameters:{ type:'object', properties:{ query:{ type:'string', description:'gaanv/tehsil/jile ka naam' } }, required:['query'] } } },
  { type:'function', function:{ name:'member_count', description:'Kitne members registered hain — total ya kisi khaas gaanv ke। Sirf ginti deta hai, kabhi personal detail nahi.', parameters:{ type:'object', properties:{ village:{ type:'string', description:'gaanv ka naam agar poocha ho, warna khaali string (total ke liye)' } } } } },
  { type:'function', function:{ name:'village_distance', description:'Do gaanv ke beech ki (hawaai) doori batata hai.', parameters:{ type:'object', properties:{ query:{ type:'string', description:'dono gaanv ke naam, jaise "Karwad aur Sanwer"' } }, required:['query'] } } },
  { type:'function', function:{ name:'nearest_search', description:'Kisi gaanv/jagah ke sabse paas ka hospital, dharamshala, ya business dhoondhta hai — jab koi "nearest/paas" bole, ya seedhe apni takleef/zaroorat bataye (jaise "bimar hu", "chot lagi") jisse woh असल mein nearest hospital dhoond raha ho.', parameters:{ type:'object', properties:{ query:{ type:'string', description:'poora original sawaal jaisa user ne poocha, jagah/area sameत' } }, required:['query'] } } },
  { type:'function', function:{ name:'samaj_news', description:'Samaj ki taaza news dikhata hai.', parameters:{ type:'object', properties:{} } } },
  { type:'function', function:{ name:'samaj_events', description:'Samaj ke aane wale events/karyakram dikhata hai.', parameters:{ type:'object', properties:{} } } },
  { type:'function', function:{ name:'shaadi_or_property_redirect', description:'Jab koi Shaadi/vivaah/matrimony YA Property/makan/kiraye ke baare mein pooche — yeh data yahan available nahi hai, sirf redirect milta hai.', parameters:{ type:'object', properties:{ kind:{ type:'string', enum:['shaadi','property'] } }, required:['kind'] } } }
];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GROQ_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ai-agent: GROQ_API_KEY not set');
    return { statusCode: 200, body: JSON.stringify({ error: 'no_key' }) };
  }

  let messages, adminInstructions;
  try {
    const parsed = JSON.parse(event.body || '{}');
    if (!Array.isArray(parsed.messages) || !parsed.messages.length) throw new Error('bad messages');
    messages = parsed.messages.slice(-20).map(m => {
      const out = { role: m.role };
      if (m.content !== undefined && m.content !== null) out.content = String(m.content).slice(0, 2000);
      if (Array.isArray(m.tool_calls)) out.tool_calls = m.tool_calls;
      if (m.tool_call_id) out.tool_call_id = String(m.tool_call_id);
      if (['user','assistant','tool','system'].indexOf(out.role) === -1) throw new Error('bad role');
      return out;
    });
    adminInstructions = Array.isArray(parsed.adminInstructions)
      ? parsed.adminInstructions.filter(s => typeof s === 'string' && s.trim()).slice(0, 20).map(s => s.trim().slice(0, 500))
      : [];
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'bad_request' }) };
  }

  // Admin (voice se bola ya type kiya) ke extra instructions system prompt mein jud jaate hain — par core
  // safety rules (upar ke General Principles: kabhi data mat banao, medical/legal/financial advice mat do,
  // personal info mat do) hamesha priority mein rehte hain, admin instructions unhe override nahi kar sakti।
  const fullSystemPrompt = adminInstructions.length
    ? SYSTEM_PROMPT + '\n\n---\nAdmin ne yeh extra instructions di hain (inhe bhi follow karo, par upar ke\nGeneral Principles hamesha priority mein rahenge — yeh unhe override nahi kar sakti):\n' +
      adminInstructions.map(s => '- ' + s).join('\n')
    : SYSTEM_PROMPT;

  try {
    // gpt-oss-120b (bada, zyada capable model) primary hai — free-tier limit gpt-oss-20b jitna hi hai,
    // isliye better reasoning/tool-selection bilkul free mein milta hai। Agar yeh fail/timeout ho (jaise
    // rate-limit ka transient error) to chhote-tez gpt-oss-20b par ek retry hota hai, taaki koi single
    // model down/slow hone se poora agent na ruke।
    async function callGroq(model){
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      try{
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'system', content: fullSystemPrompt }, ...messages],
            tools: TOOLS,
            tool_choice: 'auto',
            temperature: 0.4,
            max_tokens: 700
          }),
          signal: ctrl.signal
        });
        return resp;
      } finally { clearTimeout(timer); }
    }

    async function callHaikuFallback(){
      if (!anthropicKey) return null;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: HAIKU_MODEL,
            max_tokens: 700,
            system: fullSystemPrompt,
            tools: toAnthropicTools(TOOLS),
            messages: toAnthropicMessages(messages)
          }),
          signal: ctrl.signal
        });
        if (!resp.ok) {
          const errText = await resp.text().catch(() => '');
          console.error('ai-agent: Claude Haiku fallback responded', resp.status, errText.slice(0, 300));
          return null;
        }
        const data = await resp.json();
        return fromAnthropicMessage(data);
      } catch (e) {
        console.error('ai-agent: Claude Haiku fallback failed', e && e.message);
        return null;
      } finally { clearTimeout(timer); }
    }

    let resp = await callGroq('openai/gpt-oss-120b');
    if (!resp.ok) {
      console.error('ai-agent: gpt-oss-120b responded', resp.status, '— retrying with gpt-oss-20b');
      resp = await callGroq('openai/gpt-oss-20b');
    }

    if (!resp.ok) {
      console.error('ai-agent: both Groq models failed, trying Claude Haiku fallback');
      const fallbackMsg = await callHaikuFallback();
      if (fallbackMsg) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: fallbackMsg }) };
      const errText = await resp.text().catch(() => '');
      console.error('ai-agent: Groq responded', resp.status, errText.slice(0, 300));
      return { statusCode: 200, body: JSON.stringify({ error: 'groq_error' }) };
    }
    const data = await resp.json();
    const msg = data && data.choices && data.choices[0] && data.choices[0].message;
    if (!msg) {
      console.error('ai-agent: no message in Groq response, trying Claude Haiku fallback');
      const fallbackMsg = await callHaikuFallback();
      if (fallbackMsg) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: fallbackMsg }) };
      console.error('ai-agent: no message in response', JSON.stringify(data).slice(0, 300));
      return { statusCode: 200, body: JSON.stringify({ error: 'no_message' }) };
    }
    console.log('ai-agent: tool_calls=', (msg.tool_calls || []).map(t => t.function && t.function.name).join(','));
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) };
  } catch (e) {
    console.error('ai-agent: exception', e && e.message);
    return { statusCode: 200, body: JSON.stringify({ error: 'exception' }) };
  }
};
