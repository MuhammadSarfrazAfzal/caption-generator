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
  ChevronDown
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
  volume = 0.85,
  style,
  onUpdateStyle,
  position,
  onPositionChange,
  displayMode,
  onUploadClick,
  showSafeZone,
  onToggleSafeZone,
  aspectRatioMode = 'auto',
  onChangeAspectRatio
}) {
  const containerRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [isFormatOpen, setIsFormatOpen] = useState(false);

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setIsSpeedOpen(false);
  };

  const handlePlayThisCue = () => {
    if (!activeCaption || !videoRef.current) return;
    onSeek(activeCaption.start + 0.01);
    if (!isPlaying) onPlayPause();
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

  // Precise time formatter: 00:00:08.900
  const formatTimecode = (secs) => {
    if (typeof secs !== 'number' || isNaN(secs) || secs < 0) return '00:00:00.000';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  const aspectRatios = [
    { id: 'auto', label: 'Fit' },
    { id: '9:16', label: '9:16 Reels' },
    { id: '16:9', label: '16:9' },
    { id: '1:1', label: '1:1' }
  ];

  return (
    <div className="flex-1 flex flex-col bg-white p-5 select-none overflow-hidden justify-between">
      {/* Main Video Viewport (Clean black box, NO cluttered top row!) */}
      <div className="flex-1 bg-black rounded-xl overflow-hidden relative flex items-center justify-center shadow-inner min-h-[300px]">
        {videoSrc ? (
          <div
            ref={containerRef}
            className={`relative max-w-full max-h-full flex items-center justify-center ${
              aspectRatioMode === '9:16' ? 'aspect-[9/16] h-full' :
              aspectRatioMode === '16:9' ? 'aspect-[16/9] w-full' :
              aspectRatioMode === '1:1' ? 'aspect-square h-full' :
              'w-full h-full'
            }`}
          >
            <video
              ref={videoRef}
              src={videoSrc}
              className="max-w-full max-h-full w-auto h-auto object-contain block pointer-events-auto"
              onClick={onPlayPause}
              playsInline
            />

            {/* Draggable Caption Box with Glass Selection Frame & Proximity Sensor */}
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

            {/* Safe Zone Visual Guide */}
            {showSafeZone && (
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="safe-area-overlay" />
                <div className="absolute top-2 left-3 text-[9px] text-[#bbf421] font-mono tracking-wider bg-black/80 px-2 py-0.5 rounded border border-[#84cc16]/50">
                  REELS / TIKTOK SAFE AREA
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={onUploadClick}
            className="flex flex-col items-center justify-center p-8 text-center cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-[#bbf421] group-hover:scale-105 transition-all mb-3 shadow-md">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              Drop your video here or click to browse
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs">
              Supports MP4, MOV, WebM. Audio will be transcribed to Roman Urdu.
            </p>
          </div>
        )}
      </div>

      {/* Video Control Bar below video (Clean, single unified row matching reference!) */}
      <div className="mt-3.5 flex items-center justify-between text-xs select-none">
        {/* Play/Pause Button & Timecode */}
        <div className="flex items-center gap-3">
          {/* Black Circular Play/Pause Button */}
          <button
            onClick={onPlayPause}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white flex items-center justify-center shadow-xs cursor-pointer transition-transform"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          {/* Timecode */}
          <div className="font-mono text-xs font-semibold text-zinc-800 tracking-tight">
            <span>{formatTimecode(currentTime)}</span>
            <span className="mx-1.5 text-zinc-300">/</span>
            <span className="text-zinc-500">{formatTimecode(duration)}</span>
          </div>

          {/* Play this cue quick link */}
          {activeCaption && (
            <button
              onClick={handlePlayThisCue}
              className="text-xs font-semibold text-lime-800 hover:text-lime-900 bg-lime-100/70 hover:bg-lime-200/70 px-2.5 py-1 rounded-lg border border-lime-300/80 transition-colors cursor-pointer ml-1"
            >
              Play this cue
            </button>
          )}
        </div>

        {/* Video Stage Controls: Aspect Ratio, Safe Zones, Speed, Volume, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Aspect Ratio Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setIsFormatOpen(!isFormatOpen)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold cursor-pointer"
              title="Change Aspect Ratio"
            >
              <span>{aspectRatios.find(r => r.id === aspectRatioMode)?.label || 'Fit'}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {isFormatOpen && (
              <div className="absolute right-0 bottom-full mb-1 w-28 bg-white rounded-xl shadow-lg border border-zinc-200 py-1 z-50">
                {aspectRatios.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      onChangeAspectRatio(r.id);
                      setIsFormatOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1 text-xs font-medium hover:bg-lime-50 hover:text-zinc-950 cursor-pointer ${
                      aspectRatioMode === r.id ? 'bg-lime-100 font-bold text-zinc-950' : 'text-zinc-600'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Safe Zones Toggle */}
          <button
            onClick={onToggleSafeZone}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showSafeZone 
                ? 'bg-lime-100 text-lime-900 border-lime-300' 
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}
            title="Toggle Reels/TikTok Safe Zone Guides"
          >
            {showSafeZone ? <Eye className="w-3.5 h-3.5 text-lime-700" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-400" />}
          </button>

          {/* Playback Speed (1x ▾) */}
          <div className="relative">
            <button
              onClick={() => setIsSpeedOpen(!isSpeedOpen)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold cursor-pointer"
            >
              <span>{playbackRate}x</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {isSpeedOpen && (
              <div className="absolute right-0 bottom-full mb-1 w-20 bg-white rounded-xl shadow-lg border border-zinc-200 py-1 z-50">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`w-full text-center px-2 py-1 text-xs font-medium hover:bg-lime-50 hover:text-zinc-950 cursor-pointer ${
                      playbackRate === s ? 'bg-lime-100 font-bold text-zinc-950' : 'text-zinc-600'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume Toggle */}
          <button
            onClick={handleMuteToggle}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleFullscreen}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
            title="Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
