// Admin apni awaaz mein AI ke liye instruction bolta hai — yeh function sirf usi audio ko Groq ke free
// Whisper speech-to-text model se text mein badalta hai। Koi data yahan store nahi hota, sirf transcribe
// karke turant text wapas bhej deta hai — admin usse review/edit karke khud save karta hai।
// Groq key sirf yahan (server-side env var) rehti hai, browser mein kabhi nahi jaati.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('transcribe-audio: GROQ_API_KEY not set');
    return { statusCode: 200, body: JSON.stringify({ error: 'no_key' }) };
  }

  let audioBuffer, mimeType;
  try {
    const parsed = JSON.parse(event.body || '{}');
    if (!parsed.audio || typeof parsed.audio !== 'string') throw new Error('missing audio');
    audioBuffer = Buffer.from(parsed.audio, 'base64');
    if (audioBuffer.length === 0 || audioBuffer.length > 20 * 1024 * 1024) throw new Error('bad size'); // 20MB cap
    mimeType = typeof parsed.mimeType === 'string' ? parsed.mimeType : 'audio/webm';
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'bad_request' }) };
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);

    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'webm';
    const form = new FormData();
    form.append('file', new Blob([audioBuffer], { type: mimeType }), 'instruction.' + ext);
    form.append('model', 'whisper-large-v3');
    form.append('response_format', 'json');

    const resp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      body: form,
      signal: ctrl.signal
    });
    clearTimeout(timer);

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('transcribe-audio: Groq responded', resp.status, errText.slice(0, 300));
      return { statusCode: 200, body: JSON.stringify({ error: 'groq_error' }) };
    }
    const data = await resp.json();
    const text = typeof data.text === 'string' ? data.text.trim() : '';
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) };
  } catch (e) {
    console.error('transcribe-audio: exception', e && e.message);
    return { statusCode: 200, body: JSON.stringify({ error: 'exception' }) };
  }
};
