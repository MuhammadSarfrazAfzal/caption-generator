/**
 * Sample Roman Urdu Project & Demo Media Generator
 */

export const SAMPLE_ROMAN_URDU_CAPTIONS = [
  {
    id: 1,
    start: 0.5,
    end: 2.8,
    text: "Assalam-o-Alaikum dosto! Kya haal hain aap sab ke?",
    words: [
      { word: "Assalam-o-Alaikum", start: 0.5, end: 1.2 },
      { word: "dosto!", start: 1.2, end: 1.7 },
      { word: "Kya", start: 1.7, end: 1.9 },
      { word: "haal", start: 1.9, end: 2.2 },
      { word: "hain", start: 2.2, end: 2.4 },
      { word: "aap", start: 2.4, end: 2.6 },
      { word: "sab", start: 2.6, end: 2.7 },
      { word: "ke?", start: 2.7, end: 2.8 }
    ]
  },
  {
    id: 2,
    start: 3.1,
    end: 5.9,
    text: "Aaj ki is video mein hum seekhenge viral captions banana.",
    words: [
      { word: "Aaj", start: 3.1, end: 3.4 },
      { word: "ki", start: 3.4, end: 3.6 },
      { word: "is", start: 3.6, end: 3.8 },
      { word: "video", start: 3.8, end: 4.2 },
      { word: "mein", start: 4.2, end: 4.4 },
      { word: "hum", start: 4.4, end: 4.7 },
      { word: "seekhenge", start: 4.7, end: 5.1 },
      { word: "viral", start: 5.1, end: 5.4 },
      { word: "captions", start: 5.4, end: 5.7 },
      { word: "banana.", start: 5.7, end: 5.9 }
    ]
  },
  {
    id: 3,
    start: 6.2,
    end: 8.8,
    text: "Yeh captions bilkul CapCut style mein animated hain.",
    words: [
      { word: "Yeh", start: 6.2, end: 6.5 },
      { word: "captions", start: 6.5, end: 6.9 },
      { word: "bilkul", start: 6.9, end: 7.3 },
      { word: "CapCut", start: 7.3, end: 7.7 },
      { word: "style", start: 7.7, end: 8.0 },
      { word: "mein", start: 8.0, end: 8.3 },
      { word: "animated", start: 8.3, end: 8.6 },
      { word: "hain.", start: 8.6, end: 8.8 }
    ]
  },
  {
    id: 4,
    start: 9.1,
    end: 12.0,
    text: "Aap text ko screen par kahin bhi drag aur position kar sakte hain!",
    words: [
      { word: "Aap", start: 9.1, end: 9.4 },
      { word: "text", start: 9.4, end: 9.7 },
      { word: "ko", start: 9.7, end: 9.9 },
      { word: "screen", start: 9.9, end: 10.3 },
      { word: "par", start: 10.3, end: 10.5 },
      { word: "kahin", start: 10.5, end: 10.8 },
      { word: "bhi", start: 10.8, end: 11.0 },
      { word: "drag", start: 11.0, end: 11.3 },
      { word: "aur", start: 11.3, end: 11.5 },
      { word: "position", start: 11.5, end: 11.8 },
      { word: "kar sakte hain!", start: 11.8, end: 12.0 }
    ]
  },
  {
    id: 5,
    start: 12.3,
    end: 15.0,
    text: "Aur aakhir mein apni video ko direct high quality mein export karein.",
    words: [
      { word: "Aur", start: 12.3, end: 12.6 },
      { word: "aakhir", start: 12.6, end: 13.0 },
      { word: "mein", start: 13.0, end: 13.2 },
      { word: "apni", start: 13.2, end: 13.5 },
      { word: "video", start: 13.5, end: 13.9 },
      { word: "ko", start: 13.9, end: 14.1 },
      { word: "direct", start: 14.1, end: 14.4 },
      { word: "high quality", start: 14.4, end: 14.7 },
      { word: "export", start: 14.7, end: 14.9 },
      { word: "karein.", start: 14.9, end: 15.0 }
    ]
  }
];

/**
 * Creates a lightweight animated video with audio in memory
 * so the user can immediately test without needing to supply a video file.
 */
export function createDemoVideoBlob() {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920; // 9:16 vertical TikTok/Reels format
    const ctx = canvas.getContext('2d');

    // Create Web Audio tone synthesizer to ensure an audio track exists
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0.05; // soft ambient tone
    osc.frequency.value = 440;
    osc.connect(gain);
    gain.connect(dest);
    osc.start();

    const canvasStream = canvas.captureStream(30);
    // Combine canvas video + audio track
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ]);

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm'
    });

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      osc.stop();
      audioCtx.close();
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };

    recorder.start();

    let frame = 0;
    const totalFrames = 30 * 15.5; // ~15.5 seconds
    const interval = setInterval(() => {
      frame++;
      const timeSec = (frame / 30).toFixed(1);

      // Draw rich dynamic background
      const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Draw decorative glowing circles
      const circleY = 600 + Math.sin(frame * 0.05) * 60;
      const radGrad = ctx.createRadialGradient(540, circleY, 50, 540, circleY, 400);
      radGrad.addColorStop(0, 'rgba(0, 242, 254, 0.25)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(540, circleY, 400, 0, Math.PI * 2);
      ctx.fill();

      // Draw CapCut Studio watermark badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 54px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CAPSCRIBE STUDIO', 540, 320);

      ctx.fillStyle = '#00F2FE';
      ctx.font = '600 36px Inter, sans-serif';
      ctx.fillText('Roman Urdu Caption Generator', 540, 380);

      // Draw central animated audio wave bars
      const numBars = 18;
      const barWidth = 20;
      const barGap = 16;
      const startX = 540 - ((numBars * (barWidth + barGap)) / 2);
      for (let i = 0; i < numBars; i++) {
        const barHeight = 40 + Math.sin(frame * 0.2 + i * 0.5) * 90;
        ctx.fillStyle = i % 2 === 0 ? '#FFE600' : '#00F2FE';
        ctx.fillRect(startX + i * (barWidth + barGap), 800 - barHeight / 2, barWidth, barHeight);
      }

      // Draw timecode
      ctx.fillStyle = '#94a3b8';
      ctx.font = '32px monospace';
      ctx.fillText(`DEMO VIDEO • ${timeSec}s / 15.5s`, 540, 1020);

      if (frame >= totalFrames) {
        clearInterval(interval);
        recorder.stop();
      }
    }, 1000 / 30);
  });
}
