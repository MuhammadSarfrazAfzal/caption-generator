/**
 * Subtitle and 4K Video Export Engine
 */

export function exportToSRT(captions) {
  return captions
    .map((cap, index) => {
      const start = formatSRTTime(cap.start);
      const end = formatSRTTime(cap.end);
      return `${index + 1}\n${start} --> ${end}\n${(cap.text || '').trim()}\n`;
    })
    .join('\n');
}

export function exportToVTT(captions) {
  const header = 'WEBVTT\n\n';
  const body = captions
    .map((cap, index) => {
      const start = formatVTTTime(cap.start);
      const end = formatVTTTime(cap.end);
      return `${index + 1}\n${start} --> ${end}\n${(cap.text || '').trim()}\n`;
    })
    .join('\n');
  return header + body;
}

export function exportToASS(captions, style = {}, position = { x: 50, y: 84 }, videoWidth = 1080, videoHeight = 1920) {
  const primaryColor = hexToAssColor(style.color || '#FFE600');
  const outlineColor = hexToAssColor(style.strokeColor || '#000000');
  const backColor = style.hasBackgroundBox ? hexToAssColor(style.boxColor || '#000000', style.boxOpacity ?? 0.8) : '&H80000000&';
  
  const scale = videoHeight / 720;
  const fontSize = Math.round((style.fontSize || 32) * scale * 0.7);
  const borderStyle = style.hasBackgroundBox ? 3 : 1;
  const outlineWidth = Math.max(1, Math.round((style.strokeWidth || 3) * scale * 0.5));
  const shadowDepth = Math.max(0, Math.round((style.shadowBlur || 4) * scale * 0.3));
  
  const marginV = Math.round(((100 - (position.y || 84)) / 100) * videoHeight);

  let ass = `[Script Info]
Title: Roman Urdu Subtitles
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,${fontSize},${primaryColor},&H00FFFFFF&,${outlineColor},${backColor},-1,0,0,0,100,100,0,0,${borderStyle},${outlineWidth},${shadowDepth},2,30,30,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  captions.forEach(c => {
    const start = formatASSTime(c.start);
    const end = formatASSTime(c.end);
    let text = (c.text || '').trim();
    if (style.textTransform === 'uppercase') text = text.toUpperCase();
    ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
  });

  return ass;
}

function hexToAssColor(hex = '#000000', alpha = 1) {
  let c = String(hex || '#000000').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const r = c.slice(0, 2) || '00';
  const g = c.slice(2, 4) || '00';
  const b = c.slice(4, 6) || '00';
  const a = Math.round((1 - alpha) * 255).toString(16).padStart(2, '0');
  return `&H${a}${b}${g}${r}&`.toUpperCase();
}

function formatASSTime(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor(Math.round((seconds % 1) * 100));
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export function exportToJSON(captions, style, position, metadata = {}) {
  return JSON.stringify(
    {
      version: '1.0',
      generator: 'CapScribe Studio',
      language: 'Roman Urdu',
      exportedAt: new Date().toISOString(),
      metadata,
      style,
      position,
      captions
    },
    null,
    2
  );
}

function formatSRTTime(seconds) {
  const date = new Date(0);
  date.setUTCMilliseconds(Math.round(seconds * 1000));
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const secs = String(date.getUTCSeconds()).padStart(2, '0');
  const millis = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${secs},${millis}`;
}

function formatVTTTime(seconds) {
  const date = new Date(0);
  date.setUTCMilliseconds(Math.round(seconds * 1000));
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const secs = String(date.getUTCSeconds()).padStart(2, '0');
  const millis = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${secs}.${millis}`;
}

/**
 * High-performance 4K Ultra HD Video Burning Engine
 * Draws each video frame + styled captions onto a high-res 4K Canvas
 * and records it via MediaRecorder into a high-bitrate downloadable video file.
 */
export async function renderAndBurnVideo({
  videoElement,
  captions,
  style,
  position,
  displayMode = 'line', // 'line' or 'karaoke'
  resolution = '4k',   // '4k' | '1080p' | 'original'
  onProgress = () => {}
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const origWidth = videoElement.videoWidth || 1920;
      const origHeight = videoElement.videoHeight || 1080;
      const duration = videoElement.duration;

      if (!duration || duration <= 0) {
        throw new Error('Video duration is invalid.');
      }

      const isVertical = origHeight > origWidth;
      let targetWidth = origWidth;
      let targetHeight = origHeight;
      let bitrate = 10000000; // 10 Mbps

      if (resolution === '4k') {
        bitrate = 40000000; // 40 Mbps for 4K
        if (isVertical) {
          targetWidth = 2160;
          targetHeight = 3840;
        } else if (Math.abs(origWidth - origHeight) < 50) {
          targetWidth = 2160;
          targetHeight = 2160;
        } else {
          targetWidth = 3840;
          targetHeight = 2160;
        }
      } else if (resolution === '1080p') {
        bitrate = 16000000;
        if (isVertical) {
          targetWidth = 1080;
          targetHeight = 1920;
        } else if (Math.abs(origWidth - origHeight) < 50) {
          targetWidth = 1080;
          targetHeight = 1080;
        } else {
          targetWidth = 1920;
          targetHeight = 1080;
        }
      }

      onProgress({ 
        status: 'initializing', 
        progress: 0, 
        text: `Configuring ${targetWidth}x${targetHeight} ${resolution.toUpperCase()} canvas...` 
      });

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Setup audio capture from video element
      let audioStream = null;
      try {
        if (typeof videoElement.captureStream === 'function') {
          audioStream = videoElement.captureStream();
        } else if (typeof videoElement.mozCaptureStream === 'function') {
          audioStream = videoElement.mozCaptureStream();
        }
      } catch (e) {
        console.warn('Could not capture audio stream from video element:', e);
      }

      const canvasStream = canvas.captureStream(30);
      const combinedTracks = [...canvasStream.getVideoTracks()];

      if (audioStream && audioStream.getAudioTracks().length > 0) {
        combinedTracks.push(audioStream.getAudioTracks()[0]);
      }

      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
        ? 'video/mp4;codecs=avc1'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, { 
        mimeType, 
        videoBitsPerSecond: bitrate 
      });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const outputBlob = new Blob(chunks, { type: mimeType });
        resolve(outputBlob);
      };

      recorder.onerror = (e) => reject(e);

      // Save initial state to restore later
      const originalTime = videoElement.currentTime;
      const originalMuted = videoElement.muted;
      const originalVolume = videoElement.volume;
      const originalPlaybackRate = videoElement.playbackRate;

      videoElement.pause();
      videoElement.currentTime = 0;
      videoElement.muted = false;
      videoElement.volume = 0.05; // Keep subtle volume so audioStream tracks aren't silenced
      videoElement.playbackRate = 1.0;

      await new Promise(r => {
        videoElement.onseeked = () => {
          videoElement.onseeked = null;
          r();
        };
      });

      recorder.start();
      await videoElement.play();

      let animationId;
      const renderFrame = () => {
        if (videoElement.paused || videoElement.ended) {
          if (videoElement.ended) {
            cancelAnimationFrame(animationId);
            recorder.stop();
            videoElement.currentTime = originalTime;
            videoElement.muted = originalMuted;
            videoElement.volume = originalVolume;
            videoElement.playbackRate = originalPlaybackRate;
            return;
          }
        }

        // 1. Draw scaled video frame onto 4K canvas
        ctx.drawImage(videoElement, 0, 0, targetWidth, targetHeight);

        // 2. Determine active caption
        const currentTime = videoElement.currentTime;
        const activeCap = captions.find(c => currentTime >= c.start && currentTime <= c.end);

        if (activeCap) {
          drawCaptionOnCanvas(ctx, activeCap, currentTime, targetWidth, targetHeight, style, position, displayMode);
        }

        const pct = Math.min(100, Math.round((currentTime / duration) * 100));
        onProgress({ 
          status: 'rendering', 
          progress: pct, 
          text: `Rendering 4K Captioned Video (${pct}%)...` 
        });

        animationId = requestAnimationFrame(renderFrame);
      };

      animationId = requestAnimationFrame(renderFrame);
    } catch (err) {
      reject(err);
    }
  });
}

function drawCaptionOnCanvas(ctx, caption, currentTime, canvasWidth, canvasHeight, style, position, displayMode) {
  ctx.save();

  // Scale font size proportionally to 720p base
  const scale = canvasHeight / 720;
  const scaledFontSize = Math.round((style.fontSize || 32) * scale);
  const fontFamily = style.fontFamily || "'Montserrat', sans-serif";
  const fontWeight = style.fontWeight || '800';

  ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const posX = (position.x / 100) * canvasWidth;
  const posY = (position.y / 100) * canvasHeight;

  let text = String(caption.text || '').trim();
  if (style.textTransform === 'uppercase') {
    text = text.toUpperCase();
  }

  // Draw background box if enabled
  if (style.hasBackgroundBox) {
    const textMetrics = ctx.measureText(text);
    const boxW = style.boxWidth 
      ? Math.max(textMetrics.width + (style.boxPaddingX ?? 18) * scale, style.boxWidth * scale)
      : textMetrics.width + (style.boxPaddingX ?? 18) * 2 * scale;
    const boxH = scaledFontSize * 1.35 + (style.boxPaddingY ?? 8) * 2 * scale;
    const boxRadius = (style.boxRadius || 8) * scale;

    ctx.save();
    ctx.fillStyle = hexToRgba(style.boxColor || '#000000', style.boxOpacity ?? 0.8);
    roundRect(ctx, posX - boxW / 2, posY - boxH / 2, boxW, boxH, boxRadius);
    ctx.fill();
    ctx.restore();
  }

  // Draw Drop Shadow
  if ((style.shadowBlur || 0) > 0) {
    ctx.shadowColor = style.shadowColor || 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = (style.shadowBlur || 8) * scale;
    ctx.shadowOffsetX = (style.shadowOffsetX || 0) * scale;
    ctx.shadowOffsetY = (style.shadowOffsetY || 3) * scale;
  }

  // Draw Stroke / Outline
  if ((style.strokeWidth || 0) > 0) {
    ctx.strokeStyle = style.strokeColor || '#000000';
    ctx.lineWidth = (style.strokeWidth || 3) * scale;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(text, posX, posY);
  }

  // Reset shadow for fill
  ctx.shadowColor = 'transparent';

  // Fill text (handling karaoke highlight if enabled)
  const words = Array.isArray(caption.words) ? caption.words : [];
  if (displayMode === 'karaoke' && words.length > 0) {
    drawKaraokeText(ctx, words, currentTime, posX, posY, scaledFontSize, style, scale);
  } else {
    ctx.fillStyle = style.color || '#FFE600';
    ctx.fillText(text, posX, posY);
  }

  ctx.restore();
}

function drawKaraokeText(ctx, words, currentTime, centerX, posY, fontSize, style, scale) {
  const wordWidths = words.map(w => {
    let wordText = String(w?.word || '');
    if (style.textTransform === 'uppercase') wordText = wordText.toUpperCase();
    return ctx.measureText(wordText + ' ').width;
  });

  const totalWidth = wordWidths.reduce((a, b) => a + b, 0);
  let currentX = centerX - totalWidth / 2;

  words.forEach((w, i) => {
    let wordText = String(w?.word || '');
    if (style.textTransform === 'uppercase') wordText = wordText.toUpperCase();

    const isCurrent = currentTime >= (w.start || 0) && currentTime <= (w.end || 0);
    ctx.fillStyle = isCurrent ? (style.highlightColor || '#22C55E') : (style.color || '#FFFFFF');

    ctx.textAlign = 'left';
    ctx.fillText(wordText, currentX, posY);
    currentX += wordWidths[i];
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function hexToRgba(hex = '#000000', alpha = 1) {
  let c = String(hex || '#000000').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16) || 0;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha ?? 1})`;
}
