/**
 * Roman Urdu AI Caption Generator
 * Integrates with Google Gemini API and OpenAI/Groq Whisper API
 */

export async function generateRomanUrduCaptions({
  base64Audio,
  apiKey,
  model = 'gemini-2.5-flash',
  provider = 'gemini',
  customPrompt = '',
  onProgress = () => {}
}) {
  if (!apiKey) {
    throw new Error('Please configure your API key in Settings (Google Gemini or Groq/OpenAI)');
  }

  if (provider === 'gemini') {
    return transcribeWithGemini({ base64Audio, apiKey, model, customPrompt, onProgress });
  } else if (provider === 'groq' || provider === 'openai') {
    return transcribeWithWhisper({ base64Audio, apiKey, provider, onProgress });
  } else {
    throw new Error('Unsupported transcription provider: ' + provider);
  }
}

async function transcribeWithGemini({ base64Audio, apiKey, model, customPrompt, onProgress }) {
  onProgress('Sending audio to Google Gemini AI for Roman Urdu transcription...');

  // Fallback chain in case a specific preview model is not yet accessible
  const candidateModels = [model, 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  const uniqueModels = [...new Set(candidateModels)];

  let lastError = null;

  for (const targetModel of uniqueModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey.trim()}`;

      const systemInstruction = `You are a world-class speech-to-text transcribing AI specializing in Roman Urdu (Urdu spoken in Pakistan and South Asia, written strictly using Latin/English characters, e.g., "kya haal hai", "aaj hum seekhenge", "bohot shukriya", "yeh video bohot informative hai").

CRITICAL INSTRUCTIONS:
1. Transcribe the spoken audio VERBATIM into natural, correct Roman Urdu (Latin script only).
2. Segment the speech into punchy, ultra-short viral subtitle lines: MAXIMUM 1 TO 3 WORDS PER LINE (never more than 3 words per line, e.g., "Software agency build", "karna jitna asaan").
3. Calculate precise start and end timestamps as continuous elapsed SECONDS from 0.0 (e.g., 65.4 for 1 minute 5.4 seconds, 70.2 for 1 minute 10.2 seconds). NEVER use mm.ss or 1xx for minutes (e.g. NEVER output 105.4 for 1:05.4, output 65.4). Formula: total_seconds = (minutes * 60) + seconds.
4. Provide word-level timestamps in a "words" array for each subtitle segment to enable CapCut karaoke highlight.
5. If non-speech or background silence occurs, do not hallucinate words.
${customPrompt ? `ADDITIONAL USER INSTRUCTION: ${customPrompt}` : ''}

OUTPUT FORMAT:
Output ONLY a strictly valid JSON array. No explanations, no markdown formatting outside JSON.
[
  {
    "id": 1,
    "start": 0.0,
    "end": 2.2,
    "text": "Assalam-o-Alaikum dosto",
    "words": [
      { "word": "Assalam-o-Alaikum", "start": 0.0, "end": 1.2 },
      { "word": "dosto", "start": 1.2, "end": 2.2 }
    ]
  }
]`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Transcribe this audio strictly into Roman Urdu with accurate timestamps and words. Respond only with the JSON array.'
              },
              {
                inline_data: {
                  mime_type: 'audio/wav',
                  data: base64Audio
                }
              }
            ]
          }
        ],
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      };

      onProgress(`Transcribing with ${targetModel}...`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Gemini returned an empty response. Please verify audio clarity.');
      }

      onProgress('Parsing Roman Urdu subtitle timestamps...');
      const parsedCaptions = extractJsonArray(rawText);

      if (!Array.isArray(parsedCaptions) || parsedCaptions.length === 0) {
        throw new Error('No speech detected in audio file.');
      }

      return normalizeCaptions(parsedCaptions);
    } catch (err) {
      console.warn(`Attempt with ${targetModel} failed:`, err.message);
      lastError = err;
      if (err.message.includes('API_KEY_INVALID') || err.message.includes('401') || err.message.includes('403')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to transcribe audio with Gemini API');
}

async function transcribeWithWhisper({ base64Audio, apiKey, provider, onProgress }) {
  onProgress(`Sending to ${provider.toUpperCase()} Whisper API...`);

  const byteCharacters = atob(base64Audio);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const audioBlob = new Blob([byteArray], { type: 'audio/wav' });

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('model', provider === 'groq' ? 'whisper-large-v3' : 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('prompt', 'Transcribe in Roman Urdu using English alphabet (e.g. kya haal hai, aaj hum baat karenge, shukriya).');
  formData.append('timestamp_granularities[]', 'segment');
  formData.append('timestamp_granularities[]', 'word');

  const endpoint = provider === 'groq' 
    ? 'https://api.groq.com/openai/v1/audio/transcriptions'
    : 'https://api.openai.com/v1/audio/transcriptions';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`
    },
    body: formData
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`${provider.toUpperCase()} API error (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const segments = result.segments || [];

  return segments.map((seg, idx) => ({
    id: idx + 1,
    start: Number(seg.start.toFixed(2)),
    end: Number(seg.end.toFixed(2)),
    text: String(seg.text || '').trim(),
    words: (result.words || [])
      .filter(w => w.start >= seg.start - 0.1 && w.end <= seg.end + 0.1)
      .map(w => ({ word: String(w.word || '').trim(), start: Number(w.start.toFixed(2)), end: Number(w.end.toFixed(2)) }))
  }));
}

function extractJsonArray(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.captions)) return parsed.captions;
    if (parsed && Array.isArray(parsed.subtitles)) return parsed.subtitles;
    if (parsed && Array.isArray(parsed.segments)) return parsed.segments;
  } catch (e) {
    // Try regex extraction of [...]
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    throw e;
  }
  return [];
}

export function healTimestamp(val) {
  let num = typeof val === 'number' ? val : parseFloat(val) || 0;
  // If timestamp was formatted as mm.ss in a number (e.g. 104.99 for 1m 04.99s, or 108.7 for 1m 08.7s)
  if (num >= 100) {
    const mins = Math.floor(num / 100);
    const secs = num % 100;
    if (secs < 60) {
      num = mins * 60 + secs;
    }
  }
  return Number(num.toFixed(2));
}

export function splitCaptionsIntoMaxWords(captions, maxWords = 3) {
  const result = [];
  let nextId = 1;

  captions.forEach(cap => {
    const words = Array.isArray(cap.words) ? cap.words : [];

    if (words.length <= maxWords) {
      result.push({
        ...cap,
        id: nextId++
      });
      return;
    }

    // Split words into slices of maxWords
    for (let i = 0; i < words.length; i += maxWords) {
      const slice = words.slice(i, i + maxWords);
      const sliceStart = slice[0].start;
      const sliceEnd = slice[slice.length - 1].end;
      const sliceText = slice.map(w => w.word).join(' ');

      result.push({
        id: nextId++,
        start: Number(sliceStart.toFixed(2)),
        end: Number(sliceEnd.toFixed(2)),
        text: sliceText,
        words: slice
      });
    }
  });

  return result;
}

function normalizeCaptions(captions, maxWords = 3) {
  const initial = captions.map((item, index) => {
    let rawStart = typeof item.start === 'number' ? item.start : parseFloat(item.start) || 0;
    let rawEnd = typeof item.end === 'number' ? item.end : parseFloat(item.end) || (rawStart + 2.5);
    
    const start = healTimestamp(rawStart);
    const end = healTimestamp(rawEnd);
    const text = String(item.text || '').trim();
    
    // Construct fallback words if missing
    let words = item.words;
    if (!Array.isArray(words) || words.length === 0) {
      const splitWords = text.split(/\s+/).filter(Boolean);
      const wordDuration = splitWords.length > 0 ? (end - start) / splitWords.length : 0.5;
      words = splitWords.map((word, wIdx) => ({
        word: String(word),
        start: Number((start + wIdx * wordDuration).toFixed(2)),
        end: Number((start + (wIdx + 1) * wordDuration).toFixed(2))
      }));
    } else {
      words = words.map(w => {
        if (typeof w === 'string') {
          return { word: w, start, end };
        }
        const wStart = healTimestamp(typeof w?.start === 'number' ? w.start : parseFloat(w?.start) || start);
        const wEnd = healTimestamp(typeof w?.end === 'number' ? w.end : parseFloat(w?.end) || end);
        return {
          word: String(w?.word || ''),
          start: wStart,
          end: wEnd
        };
      });
    }

    return {
      id: item.id || (index + 1),
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      text,
      words
    };
  });

  return splitCaptionsIntoMaxWords(initial, maxWords);
}
