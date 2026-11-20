/**
 * Extracts and downsamples audio from video into a 16kHz Mono WAV base64 string
 * for speech-to-text models like Gemini and Whisper.
 */
export async function extractAudioFromVideo(videoSource, onProgress = () => {}) {
  try {
    onProgress('Loading video audio stream...');
    let arrayBuffer;
    
    if (videoSource instanceof File || videoSource instanceof Blob) {
      arrayBuffer = await videoSource.arrayBuffer();
    } else if (videoSource instanceof ArrayBuffer) {
      arrayBuffer = videoSource;
    } else if (typeof videoSource === 'string') {
      if (videoSource.startsWith('data:')) {
        // Base64 data URL
        const base64Content = videoSource.split(',')[1];
        arrayBuffer = base64ToArrayBuffer(base64Content);
      } else if (videoSource.startsWith('blob:')) {
        const response = await fetch(videoSource);
        arrayBuffer = await response.arrayBuffer();
      } else {
        // Try fetch or fallback
        try {
          const response = await fetch(videoSource);
          arrayBuffer = await response.arrayBuffer();
        } catch (fetchErr) {
          throw new Error('Could not read video stream. Please re-select the video file.');
        }
      }
    } else {
      throw new Error('Unsupported video source format');
    }

    onProgress('Decoding audio track with Web Audio API...');
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    let decodedAudio;
    try {
      decodedAudio = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (decodeErr) {
      audioCtx.close();
      throw new Error('Could not decode audio from video. The video may have no audio or an unsupported audio format.');
    }

    onProgress('Resampling to 16kHz mono audio for transcription...');
    const targetSampleRate = 16000;
    const duration = decodedAudio.duration;
    
    if (duration <= 0) {
      audioCtx.close();
      throw new Error('Video has 0 audio duration.');
    }

    const offlineCtx = new OfflineAudioContext(1, Math.ceil(duration * targetSampleRate), targetSampleRate);
    const sourceNode = offlineCtx.createBufferSource();
    sourceNode.buffer = decodedAudio;
    sourceNode.connect(offlineCtx.destination);
    sourceNode.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    audioCtx.close();

    onProgress('Encoding WAV format...');
    const channelData = renderedBuffer.getChannelData(0);
    const wavBlob = encodeWAV(channelData, targetSampleRate);

    onProgress('Preparing audio payload for Gemini AI...');
    const base64Audio = await blobToBase64(wavBlob);

    return {
      wavBlob,
      base64Audio,
      duration,
      mimeType: 'audio/wav',
    };
  } catch (error) {
    console.error('Audio extraction error:', error);
    throw new Error(error.message || 'Failed to extract audio from video');
  }
}

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + samples.length * 2, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw 16-bit PCM)
  view.setUint16(20, 1, true);
  // channel count (1 = mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, samples.length * 2, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
