import React, { useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Scissors, Type } from 'lucide-react';

export function TimelineBar({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  captions,
  activeCaptionId,
  onAddCaptionAtPlayhead
}) {
  const timelineRef = useRef(null);

  const handleTimelineClick = (e) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(pct * duration);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00.0';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="h-28 bg-[#0c0d12] border-t border-[#1e2230] flex flex-col select-none z-20">
      {/* Mini Action Bar */}
      <div className="h-8 px-4 bg-[#11131a] border-b border-[#1b1e2a] flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onPlayPause}
            className="w-5 h-5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-2.5 h-2.5 fill-black" /> : <Play className="w-2.5 h-2.5 fill-black ml-0.5" />}
          </button>
          
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 3))}
            className="text-zinc-400 hover:text-white p-0.5"
            title="Back 3s"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={() => onSeek(Math.min(duration, currentTime + 3))}
            className="text-zinc-400 hover:text-white p-0.5"
            title="Forward 3s"
          >
            <RotateCw className="w-3 h-3" />
          </button>

          <div className="font-mono text-[11px] text-zinc-400 ml-1">
            <span className="text-cyan-400 font-bold">{formatTime(currentTime)}</span>
            <span className="mx-1 text-zinc-600">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddCaptionAtPlayhead}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1c202e] hover:bg-[#262c3e] text-zinc-300 text-[11px] border border-[#2d3448] transition-colors cursor-pointer"
            title="Split/Add Caption at current time"
          >
            <Scissors className="w-3 h-3 text-cyan-400" />
            <span>Split / Add at Playhead</span>
          </button>
        </div>
      </div>

      {/* Tracks Container */}
      <div 
        ref={timelineRef}
        onClick={handleTimelineClick}
        className="flex-1 relative bg-[#0e1017] cursor-pointer overflow-hidden flex flex-col justify-center px-4"
      >
        {/* Playhead Needle */}
        <div
          style={{ left: `calc(16px + (100% - 32px) * ${playheadPercent / 100})` }}
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-30 pointer-events-none shadow-[0_0_8px_rgba(0,242,254,0.8)]"
        >
          {/* Scrubber Head */}
          <div className="w-2.5 h-3 bg-cyan-400 rounded-b -translate-x-[4px] shadow-md shadow-cyan-500/50" />
        </div>

        {/* Video Track Header */}
        <div className="relative h-6 bg-[#161822] rounded border border-[#232636] mb-1.5 flex items-center overflow-hidden">
          <span className="absolute left-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest pointer-events-none">
            VIDEO TRACK
          </span>
          {/* Time ticks */}
          <div className="w-full flex justify-between px-2 text-[8px] text-zinc-600 font-mono pointer-events-none">
            <span>00:00</span>
            <span>{formatTime(duration * 0.25)}</span>
            <span>{formatTime(duration * 0.5)}</span>
            <span>{formatTime(duration * 0.75)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Subtitles Track with Caption Blocks */}
        <div className="relative h-7 bg-[#13151f] rounded border border-[#202330] overflow-hidden">
          <span className="absolute left-2 top-1 text-[9px] font-bold text-cyan-500/60 uppercase tracking-widest pointer-events-none z-10 flex items-center gap-1">
            <Type className="w-2.5 h-2.5" />
            URDU CAPTIONS
          </span>

          {duration > 0 && captions.map((cap) => {
            const left = (cap.start / duration) * 100;
            const width = Math.max(1.5, ((cap.end - cap.start) / duration) * 100);
            const isActive = cap.id === activeCaptionId;

            return (
              <div
                key={cap.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(cap.start);
                }}
                style={{
                  left: `${left}%`,
                  width: `${width}%`
                }}
                className={`absolute top-0.5 bottom-0.5 rounded px-1 flex items-center overflow-hidden text-[10px] font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/80 to-blue-600/80 text-black font-bold shadow-md shadow-cyan-500/30 ring-1 ring-white'
                    : 'bg-[#1e2333] hover:bg-[#282e42] text-zinc-300 border border-[#2c3348]'
                }`}
                title={`${cap.text} (${formatTime(cap.start)} - ${formatTime(cap.end)})`}
              >
                <span className="truncate">{cap.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Synchronized playhead timeline rendering
