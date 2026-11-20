import React, { useState } from 'react';
import { 
  X, 
  Film, 
  FileText, 
  Code, 
  Download, 
  CheckCircle, 
  Sparkles,
  Zap
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="glass-modal w-full max-w-md rounded-2xl border border-[#2d3244] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222634] flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-100">
              Export Roman Urdu Captions & 4K Video
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isBurning}
            className="p-1 rounded-lg hover:bg-[#1f2230] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Burn-in Video Action Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#151a24] to-[#12141c] border border-emerald-600/30 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    <span>Burn-in Captions into Video</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                      4K Ultra HD
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Renders razor-sharp typography at up to 3840x2160 resolution.
                  </p>
                </div>
              </div>
            </div>

            {/* Resolution Selector */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Export Resolution Quality:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: '4k', label: '4K Ultra HD', desc: '3840 x 2160' },
                  { id: '1080p', label: '1080p FHD', desc: '1920 x 1080' },
                  { id: 'original', label: 'Original', desc: 'Source Size' },
                ].map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setResolution(res.id)}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      resolution === res.id
                        ? 'bg-emerald-500/20 border-emerald-400/80 text-emerald-300 shadow-sm'
                        : 'bg-[#151722] border-[#252838] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{res.label}</div>
                    <div className="text-[9px] text-zinc-500 font-mono">{res.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {isBurning ? (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs font-mono text-emerald-300">
                  <span className="truncate max-w-[240px]">{burnStatusText}</span>
                  <span>{burnProgress}%</span>
                </div>
                <div className="w-full bg-[#151722] rounded-full h-2 overflow-hidden border border-[#2b3042]">
                  <div
                    style={{ width: `${burnProgress}%` }}
                    className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-400 h-full transition-all duration-150"
                  />
                </div>
              </div>
            ) : isDone ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 py-1">
                <CheckCircle className="w-4 h-4" />
                <span>4K Video Rendered & Saved!</span>
              </div>
            ) : (
              <button
                onClick={handleBurnVideo}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Render & Save {resolution.toUpperCase()} Video</span>
              </button>
            )}
          </div>

          {/* Subtitle File Exports */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              Export Subtitle Files
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={handleExportSRT}
                className="p-2.5 rounded-xl bg-[#151722] hover:bg-[#1c202e] border border-[#242838] hover:border-cyan-500/50 flex flex-col items-center gap-1 transition-all text-center cursor-pointer"
              >
                <FileText className="w-4 h-4 text-yellow-400" />
                <span className="text-[11px] font-bold text-zinc-200">.SRT</span>
                <span className="text-[9px] text-zinc-500">SubRip</span>
              </button>

              <button
                onClick={handleExportVTT}
                className="p-2.5 rounded-xl bg-[#151722] hover:bg-[#1c202e] border border-[#242838] hover:border-cyan-500/50 flex flex-col items-center gap-1 transition-all text-center cursor-pointer"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-bold text-zinc-200">.VTT</span>
                <span className="text-[9px] text-zinc-500">WebVTT</span>
              </button>

              <button
                onClick={handleExportASS}
                className="p-2.5 rounded-xl bg-[#151722] hover:bg-[#1c202e] border border-[#242838] hover:border-cyan-500/50 flex flex-col items-center gap-1 transition-all text-center cursor-pointer"
              >
                <FileText className="w-4 h-4 text-purple-400" />
                <span className="text-[11px] font-bold text-zinc-200">.ASS</span>
                <span className="text-[9px] text-zinc-500">Styled ASS</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="p-2.5 rounded-xl bg-[#151722] hover:bg-[#1c202e] border border-[#242838] hover:border-cyan-500/50 flex flex-col items-center gap-1 transition-all text-center cursor-pointer"
              >
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-bold text-zinc-200">.JSON</span>
                <span className="text-[9px] text-zinc-500">Project</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#12141c] border-t border-[#222634] flex justify-end">
          <button
            onClick={onClose}
            disabled={isBurning}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#1a1d28] hover:bg-[#232736] text-zinc-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
