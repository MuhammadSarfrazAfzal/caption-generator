import React, { useState } from 'react';
import { 
  X, 
  Film, 
  FileText, 
  Code, 
  Download, 
  CheckCircle, 
  Sparkles,
  Zap,
  Layers
} from 'lucide-react';
import { exportToSRT, exportToVTT, exportToJSON, exportToASS, renderAndBurnVideo } from '../utils/srtExporter';

export function ExportModal({
  isOpen,
  onClose,
  captions,
  style,
  position,
  displayMode,
  videoRef,
  fileName = 'video',
  filePath = ''
}) {
  const [isBurning, setIsBurning] = useState(false);
  const [burnProgress, setBurnProgress] = useState(0);
  const [burnStatusText, setBurnStatusText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [resolution, setResolution] = useState('4k'); // '4k' | '1080p' | 'original'

  if (!isOpen) return null;

  const baseName = fileName.replace(/\.[^/.]+$/, '');

  const saveFile = async (content, defaultName, extension, mimeType, isBinary = false) => {
    if (window.electronAPI?.saveFileDialog) {
      if (isBinary) {
        const reader = new FileReader();
        reader.readAsDataURL(content);
        reader.onloadend = async () => {
          const base64Data = reader.result.split(',')[1];
          await window.electronAPI.saveFileDialog({
            defaultPath: defaultName,
            filters: [{ name: `${extension.toUpperCase()} File`, extensions: [extension] }],
            content: base64Data,
            encoding: 'base64'
          });
        };
      } else {
        await window.electronAPI.saveFileDialog({
          defaultPath: defaultName,
          filters: [{ name: `${extension.toUpperCase()} File`, extensions: [extension] }],
          content: content
        });
      }
    } else {
      const blob = isBinary ? content : new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportSRT = () => {
    const srtContent = exportToSRT(captions);
    saveFile(srtContent, `${baseName}_roman_urdu.srt`, 'srt', 'text/plain');
  };

  const handleExportVTT = () => {
    const vttContent = exportToVTT(captions);
    saveFile(vttContent, `${baseName}_roman_urdu.vtt`, 'vtt', 'text/vtt');
  };

  const handleExportJSON = () => {
    const jsonContent = exportToJSON(captions, style, position, { sourceVideo: fileName });
    saveFile(jsonContent, `${baseName}_project.json`, 'json', 'application/json');
  };

  const handleExportASS = () => {
    const videoW = videoRef.current?.videoWidth || 1080;
    const videoH = videoRef.current?.videoHeight || 1920;
    const assContent = exportToASS(captions, style, position, videoW, videoH);
    saveFile(assContent, `${baseName}_subtitles.ass`, 'ass', 'text/plain');
  };

  const handleBurnVideo = async () => {
    // 1. Native Hardware-Accelerated FFmpeg Export (Fast MP4)
    if (window.electronAPI?.burnWithFfmpeg && filePath) {
      try {
        setIsBurning(true);
        setBurnProgress(20);
        setBurnStatusText('Preparing styled typography tracks...');

        const videoW = videoRef.current?.videoWidth || 1080;
        const videoH = videoRef.current?.videoHeight || 1920;
        const assContent = exportToASS(captions, style, position, videoW, videoH);

        const defaultOutName = `${baseName}_captioned.mp4`;
        const saveDialogRes = await window.electronAPI.saveFileDialog({
          defaultPath: defaultOutName,
          filters: [{ name: 'MP4 Video (*.mp4)', extensions: ['mp4'] }]
        });

        if (saveDialogRes.canceled || !saveDialogRes.filePath) {
          setIsBurning(false);
          return;
        }

        setBurnProgress(60);
        setBurnStatusText('Hardware H.264 rendering with lossless audio...');

        await window.electronAPI.burnWithFfmpeg({
          inputPath: filePath,
          outputPath: saveDialogRes.filePath,
          assContent,
          resolution
        });

        setBurnProgress(100);
        setBurnStatusText('Render complete!');
        setIsBurning(false);
        setIsDone(true);

        setTimeout(() => {
          setIsDone(false);
          onClose();
        }, 1200);
        return;
      } catch (nativeErr) {
        console.warn('Native burning error, falling back to canvas:', nativeErr);
      }
    }

    // 2. High-res Canvas Fallback
    if (!videoRef.current) return;

    try {
      setIsBurning(true);
      setBurnProgress(0);
      setBurnStatusText(`Initializing ${resolution.toUpperCase()} canvas...`);

      const outputBlob = await renderAndBurnVideo({
        videoElement: videoRef.current,
        captions,
        style,
        position,
        displayMode,
        resolution,
        onProgress: ({ progress, text }) => {
          setBurnProgress(progress);
          setBurnStatusText(text);
        }
      });

      setIsBurning(false);
      setIsDone(true);
      const ext = outputBlob.type.includes('mp4') ? 'mp4' : 'webm';
      await saveFile(outputBlob, `${baseName}_${resolution}_captioned.${ext}`, ext, outputBlob.type, true);

      setTimeout(() => {
        setIsDone(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Burn video error:', err);
      setIsBurning(false);
      alert('Failed to render video: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 select-none">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-zinc-200/90 overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-zinc-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-lime-100/80 border border-lime-300 flex items-center justify-center text-lime-800">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 tracking-tight">
                Export Captions & Video
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium">
                Download subtitle files or burn permanent 4K typography into MP4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isBurning}
            className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Burn-in Video Action Card */}
          <div className="p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 flex flex-col gap-3.5 shadow-2xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-lime-200/60 border border-lime-400/80 flex items-center justify-center text-zinc-900">
                  <Film className="w-5 h-5 text-lime-800" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <span>Burn-in Captions into Video</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-100 text-lime-900 font-mono font-bold border border-lime-300">
                      4K Ultra HD
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Embeds styled Roman Urdu captions permanently with hardware acceleration.
                  </p>
                </div>
              </div>
            </div>

            {/* Resolution Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Export Resolution Quality
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '4k', label: '4K Ultra HD', desc: '3840 x 2160' },
                  { id: '1080p', label: '1080p FHD', desc: '1920 x 1080' },
                  { id: 'original', label: 'Original', desc: 'Source Size' },
                ].map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setResolution(res.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      resolution === res.id
                        ? 'bg-lime-50 border-lime-500 text-zinc-950 font-bold shadow-2xs ring-1 ring-lime-400/30'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{res.label}</div>
                    <div className="text-[9px] text-zinc-400 font-mono">{res.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {isBurning ? (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs font-mono text-lime-800 font-semibold">
                  <span className="truncate max-w-[240px]">{burnStatusText}</span>
                  <span>{burnProgress}%</span>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    style={{ width: `${burnProgress}%` }}
                    className="bg-[#bbf421] h-full transition-all duration-150"
                  />
                </div>
              </div>
            ) : isDone ? (
              <div className="flex items-center gap-2 text-xs font-bold text-lime-700 bg-lime-50 border border-lime-300 px-3 py-2 rounded-xl">
                <CheckCircle className="w-4 h-4 text-lime-600" />
                <span>Video successfully rendered and saved!</span>
              </div>
            ) : (
              <button
                onClick={handleBurnVideo}
                className="w-full py-2.5 rounded-xl bg-[#bbf421] hover:bg-[#a3e635] text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer tracking-tight"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Render & Save {resolution.toUpperCase()} MP4 Video</span>
              </button>
            )}
          </div>

          {/* Subtitle File Exports */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-2.5">
              Export Subtitle Files
            </span>
            <div className="grid grid-cols-4 gap-2.5">
              <button
                onClick={handleExportSRT}
                className="p-3 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 flex flex-col items-center gap-1 transition-all text-center cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-0.5 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-900">.SRT</span>
                <span className="text-[9px] text-zinc-400">SubRip</span>
              </button>

              <button
                onClick={handleExportVTT}
                className="p-3 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 flex flex-col items-center gap-1 transition-all text-center cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-0.5 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-900">.VTT</span>
                <span className="text-[9px] text-zinc-400">WebVTT</span>
              </button>

              <button
                onClick={handleExportASS}
                className="p-3 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 flex flex-col items-center gap-1 transition-all text-center cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-0.5 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-900">.ASS</span>
                <span className="text-[9px] text-zinc-400">Styled ASS</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="p-3 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 flex flex-col items-center gap-1 transition-all text-center cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-0.5 group-hover:scale-105 transition-transform">
                  <Code className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-900">.JSON</span>
                <span className="text-[9px] text-zinc-400">Project</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-zinc-50/70 border-t border-zinc-100 flex justify-end">
          <button
            onClick={onClose}
            disabled={isBurning}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-2xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
