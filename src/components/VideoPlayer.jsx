import React, { useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Eye, 
  EyeOff, 
  UploadCloud,
  Layers
} from 'lucide-react';
import { DraggableCaption } from './DraggableCaption';

export function VideoPlayer({
  videoSrc,
  videoRef,
  captions = [],
  activeCaption,
  currentTime = 0,
  duration = 0,
  isPlaying,
  onPlayPause,
  onSeek,
  onVolumeChange,
  volume,
  style,
  onUpdateStyle,
  position,
  onPositionChange,
  displayMode,
  onUploadClick,
  showSafeZone,
  onToggleSafeZone,
  aspectRatioMode,
  onChangeAspectRatio
}) {
  const containerRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(e => console.warn(e));
      } else {
        containerRef.current.requestFullscreen().catch(e => console.warn(e));
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#08090d] overflow-hidden relative">
      {/* Top HUD Toolbar: Aspect Ratio & Safe Zone Selector */}
      <div className="h-10 bg-[#0e1017] border-b border-[#1b1e2a] flex items-center justify-between px-4 text-xs select-none z-10">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-medium flex items-center gap-1.5 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Format:
          </span>
          {[
            { id: 'auto', label: 'Original Fit' },
            { id: '9:16', label: '9:16 (Reels/TikTok)' },
            { id: '16:9', label: '16:9 (Landscape)' },
            { id: '1:1', label: '1:1 (Square)' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeAspectRatio(item.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                aspectRatioMode === item.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-[#151722] text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSafeZone}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              showSafeZone
                ? 'bg-cyan-950/70 text-cyan-300 border-cyan-600/70 shadow-sm'
                : 'bg-[#151722] text-zinc-400 hover:text-zinc-200 border-[#232636]'
            }`}
            title="Toggle Reels / TikTok Safe Zone Guide"
          >
            {showSafeZone ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-500" />}
            <span>Safe Zones</span>
          </button>

          <button
            onClick={handleFullscreen}
            className="p-1 rounded bg-[#151722] hover:bg-[#1f2230] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Stage Viewport */}
      <div className="flex-1 relative flex items-center justify-center p-4 bg-gradient-to-b from-[#090a0f] via-[#0d0f16] to-[#07080c] overflow-hidden">
        {videoSrc ? (
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            {/* Ambient Backlight / Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-yellow-500/10 rounded-2xl blur-2xl pointer-events-none opacity-50" />

            {/* Video Container (Guaranteed visible non-collapsing dimensions) */}
            <div
              ref={containerRef}
              className={`relative rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-[#252838] bg-black flex items-center justify-center ${
                aspectRatioMode === '9:16' ? 'aspect-[9/16] h-[72vh] max-w-full' :
                aspectRatioMode === '16:9' ? 'aspect-[16/9] w-[72vw] max-w-[850px]' :
                aspectRatioMode === '1:1' ? 'aspect-square h-[68vh] max-w-full' : 
                'max-w-[85vw] max-h-[72vh] min-w-[280px] min-h-[160px]'
              }`}
            >
              <video
                ref={videoRef}
                src={videoSrc}
                className="max-w-full max-h-[72vh] w-auto h-auto object-contain block pointer-events-auto"
                onClick={onPlayPause}
                playsInline
              />

              {/* Interactive Draggable CapCut Caption Box */}
              <DraggableCaption
                caption={activeCaption}
                currentTime={currentTime}
                style={style}
                onUpdateStyle={onUpdateStyle}
                position={position}
                onPositionChange={onPositionChange}
                displayMode={displayMode}
                containerRef={containerRef}
              />

              {/* CapCut Social Safe Area Box */}
              {showSafeZone && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="safe-area-overlay" />
                  <div className="absolute top-2 left-3 text-[9px] text-cyan-400/90 font-mono tracking-wider bg-black/70 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    SAFE AREA (TIKTOK / REELS)
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty Stage / Upload Prompt */
          <div 
            onClick={onUploadClick}
            className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-[#2b3044] hover:border-cyan-400/70 bg-[#10121a]/60 hover:bg-[#141724]/90 transition-all cursor-pointer group max-w-md text-center shadow-2xl hover:shadow-cyan-500/10"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform mb-4 shadow-lg shadow-cyan-500/20">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5 tracking-wide">
              Drop your video here or click to browse
            </h3>
            <p className="text-xs text-zinc-400 mb-5 max-w-xs leading-relaxed">
              Upload MP4, MOV, WebM, or MKV. The app extracts speech audio and creates Roman Urdu captions.
            </p>
            <span className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-black shadow-lg shadow-cyan-400/20 transition-all group-hover:shadow-cyan-400/40">
              Choose Video File
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Safe zone guides for 9:16 vertical reels
