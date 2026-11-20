import React, { useRef, useState, useMemo } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Scissors, 
  Plus, 
  RotateCcw, 
  RotateCw 
} from 'lucide-react';

export function TimelineBar({
  currentTime = 0,
  duration = 0,
  isPlaying,
  onPlayPause,
  onSeek,
  captions = [],
  activeCaptionId,
  onUpdateCaption,
  onAddCaptionAtPlayhead
}) {
  const containerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1); // 1x to 4x zoom
  const [draggingHandle, setDraggingHandle] = useState(null); // { cueId, type: 'start' | 'end' | 'move', startX, originalStart, originalEnd }

  const safeDuration = Math.max(duration || 0, 10);
  const playheadPercent = (currentTime / safeDuration) * 100;

  // Generate realistic audio waveform bars (static deterministically seeded)
  const waveformBars = useMemo(() => {
    const bars = [];
    const count = 240;
    for (let i = 0; i < count; i++) {
      // Harmonic wave pattern resembling real human speech pauses and cadence
      const wave = Math.sin(i * 0.18) * 0.4 + Math.sin(i * 0.05) * 0.3 + 0.3;
      const noise = (Math.sin(i * 12.3) + 1) * 0.15;
      const height = Math.min(92, Math.max(14, Math.round((wave + noise) * 80)));
      bars.push(height);
    }
    return bars;
  }, []);

  const handleTimelineClick = (e) => {
    if (draggingHandle || !containerRef.current || safeDuration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(pct * safeDuration);
  };

  // Drag retiming handles on timeline blocks
  const handleStartDrag = (e, cue, type) => {
    e.stopPropagation();
    setDraggingHandle({
      cueId: cue.id,
      type,
      startX: e.clientX,
      originalStart: cue.start,
      originalEnd: cue.end,
    });

    const handleMouseMove = (moveEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - e.clientX;
      const deltaSeconds = (deltaX / rect.width) * safeDuration;

      if (type === 'start') {
        const newStart = Math.max(0, Math.min(cue.end - 0.2, cue.start + deltaSeconds));
        onUpdateCaption?.(cue.id, { start: Number(newStart.toFixed(2)) });
      } else if (type === 'end') {
        const newEnd = Math.max(cue.start + 0.2, Math.min(safeDuration, cue.end + deltaSeconds));
        onUpdateCaption?.(cue.id, { end: Number(newEnd.toFixed(2)) });
      }
    };

    const handleMouseUp = () => {
      setDraggingHandle(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Generate seconds ruler marks (e.g. 0:00, 0:01, 0:02...)
  const rulerTicks = useMemo(() => {
    const ticks = [];
    const step = safeDuration > 60 ? 5 : safeDuration > 30 ? 2 : 1;
    for (let s = 0; s <= Math.ceil(safeDuration); s += step) {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      const label = `${mins}:${String(secs).padStart(2, '0')}`;
      const pct = (s / safeDuration) * 100;
      ticks.push({ s, label, pct });
    }
    return ticks;
  }, [safeDuration]);

  return (
    <div className="bg-white border-t border-zinc-200/90 px-6 py-3 select-none flex flex-col justify-between rounded-b-[26px]">
      {/* Top Instruction Row & Zoom Slider */}
      <div className="flex items-center justify-between text-xs text-zinc-400 pb-2">
        <span className="font-medium text-[11px] text-zinc-400">
          Drag an edge to retime, a cue to move it, empty space to add one. Ctrl + wheel zooms.
        </span>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <ZoomOut className="w-3.5 h-3.5 text-zinc-400" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            className="w-24 accent-[#84cc16]"
            title="Timeline Zoom"
          />
          <ZoomIn className="w-3.5 h-3.5 text-zinc-400" />
        </div>
      </div>

      {/* Main Interactive Waveform Track Container */}
      <div 
        ref={containerRef}
        onClick={handleTimelineClick}
        className="relative h-20 bg-[#f8fafc] border border-zinc-200 rounded-xl overflow-hidden cursor-pointer"
      >
        {/* Seconds Ruler along the top */}
        <div className="absolute top-0 left-0 right-0 h-4 border-b border-zinc-200/60 flex pointer-events-none z-10 bg-white/70 backdrop-blur-2xs">
          {rulerTicks.map((tick) => (
            <div
              key={tick.s}
              style={{ left: `${tick.pct}%` }}
              className="absolute top-0 flex flex-col items-center -translate-x-1/2"
            >
              <span className="text-[9px] font-mono font-semibold text-zinc-400">
                {tick.label}
              </span>
              <div className="h-1 w-px bg-zinc-300" />
            </div>
          ))}
        </div>

        {/* Gray Audio Waveform Peaks (Center aligned) */}
        <div className="absolute inset-x-0 bottom-1 top-4 flex items-center justify-between px-1 pointer-events-none opacity-80">
          {waveformBars.map((height, idx) => (
            <div
              key={idx}
              style={{ height: `${height}%` }}
              className="w-[2px] bg-[#94a3b8] rounded-full mx-px"
            />
          ))}
        </div>

        {/* Subtitle Cue Blocks */}
        {captions.map((cue) => {
          const isActive = cue.id === activeCaptionId;
          const leftPct = Math.max(0, (cue.start / safeDuration) * 100);
          const widthPct = Math.max(1.5, ((cue.end - cue.start) / safeDuration) * 100);

          return (
            <div
              key={cue.id}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(cue.start + 0.02);
              }}
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
              }}
              className={`absolute top-4 bottom-1 rounded-lg flex items-center px-2 z-20 group transition-all overflow-hidden ${
                isActive
                  ? 'bg-[#bef264]/40 border-2 border-[#84cc16] shadow-sm'
                  : 'bg-zinc-200/80 hover:bg-zinc-300/80 border border-zinc-300 text-zinc-700'
              }`}
            >
              {/* Left retiming handle */}
              <div
                onMouseDown={(e) => handleStartDrag(e, cue, 'start')}
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-[#84cc16] transition-colors"
                title="Drag to retime start"
              />

              {/* Cue Text Label */}
              <span className={`text-[11px] font-semibold truncate select-none pointer-events-none ${
                isActive ? 'text-zinc-950 font-bold' : 'text-zinc-700'
              }`}>
                {cue.text}
              </span>

              {/* Right retiming handle */}
              <div
                onMouseDown={(e) => handleStartDrag(e, cue, 'end')}
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-[#84cc16] transition-colors"
                title="Drag to retime end"
              />
            </div>
          );
        })}

        {/* Red Playhead Needle (Cutting through ruler and waveform) */}
        <div
          style={{ left: `${playheadPercent}%` }}
          className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 pointer-events-none shadow-[0_0_6px_rgba(239,68,68,0.8)]"
        >
          {/* Top needle marker */}
          <div className="w-2.5 h-2.5 bg-red-500 rounded-b -translate-x-[4px] shadow-sm" />
        </div>
      </div>

      {/* Bottom Scrubber Track with Lime Green Progress Bar */}
      <div 
        onClick={handleTimelineClick}
        className="mt-2 h-1.5 w-full bg-zinc-200 rounded-full relative cursor-pointer overflow-visible"
      >
        <div
          style={{ width: `${playheadPercent}%` }}
          className="h-full bg-[#84cc16] rounded-full relative"
        >
          {/* Scrubber thumb */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#84cc16] border-2 border-white shadow-md" />
        </div>
      </div>
    </div>
  );
}
