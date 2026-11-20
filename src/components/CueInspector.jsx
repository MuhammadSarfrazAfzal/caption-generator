import React, { useState } from 'react';
import { 
  Scissors, 
  GitMerge, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Bold, 
  Italic, 
  Underline,
  CaseSensitive,
  Minus,
  Plus as PlusIcon,
  Palette,
  Check,
  Flame,
  Clock3,
  AlignLeft,
  Gauge
} from 'lucide-react';
import { CAPCUT_PRESETS } from '../utils/stylePresets';

export function CueInspector({
  captions = [],
  activeCaption,
  activeCaptionId,
  currentTime,
  onUpdateCaption,
  onDeleteCaption,
  onAddCaption,
  onSplitCaption,
  onMergeCaption,
  onSeek,
  style = {},
  onUpdateStyle,
  onOpenStyleStudio
}) {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'presets'

  const safeCaptions = Array.isArray(captions) ? captions : [];
  const activeIndex = safeCaptions.findIndex(c => c.id === activeCaptionId);
  const currentCue = activeCaption || safeCaptions[0] || null;
  const cueNumber = activeIndex >= 0 ? activeIndex + 1 : (safeCaptions.length > 0 ? 1 : 0);

  // Time format: 00:00:05.800
  const formatPreciseTime = (secs) => {
    if (typeof secs !== 'number' || isNaN(secs) || secs < 0) return '00:00:00.000';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  const formatDuration = (start, end) => {
    const diff = Math.max(0, (end || 0) - (start || 0));
    return formatPreciseTime(diff);
  };

  // Nudge timing by delta (+0.1s or -0.1s)
  const handleNudgeStart = (delta) => {
    if (!currentCue || !onUpdateCaption) return;
    const newStart = Math.max(0, Number((currentCue.start + delta).toFixed(3)));
    if (newStart < currentCue.end) {
      onUpdateCaption(currentCue.id, { start: newStart });
    }
  };

  const handleNudgeEnd = (delta) => {
    if (!currentCue || !onUpdateCaption) return;
    const newEnd = Math.max(currentCue.start + 0.1, Number((currentCue.end + delta).toFixed(3)));
    onUpdateCaption(currentCue.id, { end: newEnd });
  };

  const handleTextChange = (e) => {
    if (!currentCue || !onUpdateCaption) return;
    onUpdateCaption(currentCue.id, { text: e.target.value });
  };

  // Metrics computation
  const text = currentCue?.text || '';
  const charCount = text.length;
  const durationSec = currentCue ? Math.max(0.1, currentCue.end - currentCue.start) : 1;
  const cpsNum = parseFloat((charCount / durationSec).toFixed(1));
  const isCpsGood = cpsNum <= 17;
  const lines = text.split('\n');
  const lineCount = lines.length;
  const maxLineLength = Math.max(...lines.map(l => l.length), 0);

  // Quick navigation
  const handlePrevCue = () => {
    if (activeIndex > 0 && onSeek) {
      onSeek(safeCaptions[activeIndex - 1].start + 0.05);
    }
  };

  const handleNextCue = () => {
    if (activeIndex < safeCaptions.length - 1 && onSeek) {
      onSeek(safeCaptions[activeIndex + 1].start + 0.05);
    }
  };

  return (
    <div className="flex-1 bg-white border-l border-zinc-200/80 flex flex-col justify-between p-6 select-none overflow-y-auto">
      <div className="space-y-4">
        {/* Cue Header with Clean Typography matching reference */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
              Cue {cueNumber} of {safeCaptions.length || 0}
            </h3>
            {safeCaptions.length > 1 && (
              <div className="flex items-center text-zinc-400">
                <button
                  onClick={handlePrevCue}
                  disabled={activeIndex <= 0}
                  className="p-0.5 rounded hover:bg-zinc-100 text-zinc-500 disabled:opacity-25 cursor-pointer"
                  title="Previous cue"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextCue}
                  disabled={activeIndex >= safeCaptions.length - 1}
                  className="p-0.5 rounded hover:bg-zinc-100 text-zinc-500 disabled:opacity-25 cursor-pointer"
                  title="Next cue"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Clean Segmented Tab Toggle */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                activeTab === 'editor' 
                  ? 'bg-white text-zinc-950 shadow-xs' 
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'presets' 
                  ? 'bg-white text-zinc-950 shadow-xs' 
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Palette className="w-3 h-3 text-[#84cc16]" />
              <span>16 Presets</span>
            </button>
          </div>
        </div>

        {activeTab === 'editor' ? (
          <>
            {/* Precision Digital Timing Grid (Apple Studio / Linear Aesthetic) */}
            <div className="grid grid-cols-3 gap-3">
              {/* Start Time Box */}
              <div className="bg-[#f8fafc] border border-zinc-200/90 rounded-2xl p-3 flex flex-col justify-between shadow-2xs hover:border-zinc-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Start</span>
                  <Clock3 className="w-3 h-3 text-zinc-300" />
                </div>
                <div className="my-1.5 font-mono text-[13px] font-bold text-zinc-900 tracking-tight truncate">
                  {formatPreciseTime(currentCue?.start)}
                </div>
                <div className="flex items-center justify-between border-t border-zinc-200/70 pt-2 text-zinc-600">
                  <button
                    onClick={() => handleNudgeStart(-0.1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-zinc-200/80 active:scale-95 border border-zinc-200/60 flex items-center justify-center cursor-pointer shadow-2xs transition-all"
                    title="-0.1s"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-zinc-400 font-mono">0.1s</span>
                  <button
                    onClick={() => handleNudgeStart(0.1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-zinc-200/80 active:scale-95 border border-zinc-200/60 flex items-center justify-center cursor-pointer shadow-2xs transition-all"
                    title="+0.1s"
                  >
                    <PlusIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* End Time Box */}
              <div className="bg-[#f8fafc] border border-zinc-200/90 rounded-2xl p-3 flex flex-col justify-between shadow-2xs hover:border-zinc-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">End</span>
                  <Clock3 className="w-3 h-3 text-zinc-300" />
                </div>
                <div className="my-1.5 font-mono text-[13px] font-bold text-zinc-900 tracking-tight truncate">
                  {formatPreciseTime(currentCue?.end)}
                </div>
                <div className="flex items-center justify-between border-t border-zinc-200/70 pt-2 text-zinc-600">
                  <button
                    onClick={() => handleNudgeEnd(-0.1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-zinc-200/80 active:scale-95 border border-zinc-200/60 flex items-center justify-center cursor-pointer shadow-2xs transition-all"
                    title="-0.1s"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-zinc-400 font-mono">0.1s</span>
                  <button
                    onClick={() => handleNudgeEnd(0.1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-zinc-200/80 active:scale-95 border border-zinc-200/60 flex items-center justify-center cursor-pointer shadow-2xs transition-all"
                    title="+0.1s"
                  >
                    <PlusIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Duration Box */}
              <div className="bg-[#f8fafc] border border-zinc-200/90 rounded-2xl p-3 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Duration</span>
                  <span className="text-[10px] text-[#84cc16] font-mono font-bold px-1.5 py-0.2 rounded bg-lime-100">Live</span>
                </div>
                <div className="my-1.5 font-mono text-[13px] font-bold text-zinc-900 tracking-tight truncate">
                  {formatDuration(currentCue?.start, currentCue?.end)}
                </div>
                <div className="h-6 flex items-center justify-center text-[10px] text-zinc-400 border-t border-zinc-200/70 pt-2 font-mono">
                  {durationSec.toFixed(2)}s total
                </div>
              </div>
            </div>

            {/* Quick Typography & Formatting Strip */}
            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200/80 p-1.5 rounded-xl">
              <div className="flex items-center gap-1 text-zinc-700">
                <button
                  onClick={() => onUpdateStyle?.({ 
                    fontWeight: style.fontWeight === '900' ? '600' : '900' 
                  })}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    style.fontWeight === '900' 
                      ? 'bg-zinc-950 text-white shadow-xs' 
                      : 'hover:bg-zinc-200/80 text-zinc-700'
                  }`}
                  title="Toggle Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onUpdateStyle?.({ 
                    fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' 
                  })}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    style.fontStyle === 'italic' 
                      ? 'bg-zinc-950 text-white shadow-xs' 
                      : 'hover:bg-zinc-200/80 text-zinc-700'
                  }`}
                  title="Toggle Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onUpdateStyle?.({ 
                    textDecoration: style.textDecoration === 'underline' ? 'none' : 'underline' 
                  })}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    style.textDecoration === 'underline' 
                      ? 'bg-zinc-950 text-white shadow-xs' 
                      : 'hover:bg-zinc-200/80 text-zinc-700'
                  }`}
                  title="Toggle Underline"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onUpdateStyle?.({ 
                    textTransform: style.textTransform === 'uppercase' ? 'none' : 'uppercase' 
                  })}
                  className={`px-2 h-7 rounded-lg flex items-center gap-0.5 text-[11px] font-bold transition-all cursor-pointer ${
                    style.textTransform === 'uppercase' 
                      ? 'bg-zinc-950 text-white shadow-xs' 
                      : 'hover:bg-zinc-200/80 text-zinc-700'
                  }`}
                  title="Toggle UPPERCASE"
                >
                  <span>Aa</span>
                </button>
              </div>

              <button
                onClick={onOpenStyleStudio}
                className="text-xs font-bold text-zinc-800 hover:text-black flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-zinc-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5 text-[#84cc16]" />
                <span>Style Studio</span>
              </button>
            </div>

            {/* Main Cue Text Input Area */}
            <div className="relative">
              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder="Type or edit caption text here..."
                rows={3}
                className="w-full bg-[#f8fafc] hover:bg-white focus:bg-white border border-zinc-200 rounded-2xl p-4 text-zinc-900 text-[14px] leading-relaxed font-semibold focus:outline-none focus:border-[#84cc16] focus:ring-4 focus:ring-[#84cc16]/10 shadow-inner resize-none transition-all"
              />
              <span className="absolute bottom-3 right-3 text-[10px] font-mono text-zinc-400 bg-white/80 px-1.5 py-0.5 rounded border border-zinc-200/60 pointer-events-none">
                {charCount} chars
              </span>
            </div>

            {/* Reading Speed & Quality Metrics Bar */}
            <div className="bg-zinc-50 border border-zinc-200/70 rounded-xl px-3.5 py-2 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <Gauge className={`w-3.5 h-3.5 ${isCpsGood ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span className={`font-bold ${isCpsGood ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {cpsNum} CPS
                </span>
                <span className="text-zinc-400 text-[10px]">(safe ≤ 17)</span>
              </div>
              <span className="text-zinc-300">•</span>
              <div className="text-zinc-600">
                Length: <strong className="text-zinc-900">{maxLineLength}</strong> <span className="text-zinc-400 text-[10px]">(max 42)</span>
              </div>
              <span className="text-zinc-300">•</span>
              <div className="text-zinc-600">
                {lineCount} {lineCount === 1 ? 'line' : 'lines'}
              </div>
            </div>
          </>
        ) : (
          /* Presets Quick Grid */
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            <p className="text-xs text-zinc-500 font-medium">
              Click any of the 16 CapCut & TikTok viral presets:
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {CAPCUT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onUpdateStyle?.(preset.style)}
                  className="p-3 rounded-2xl border border-zinc-200/90 hover:border-[#84cc16] bg-white hover:bg-lime-50/40 text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
                >
                  <span className="text-[11px] font-bold text-zinc-800 block truncate group-hover:text-lime-800">
                    {preset.name}
                  </span>
                  <div 
                    style={{
                      fontFamily: preset.style.fontFamily,
                      fontWeight: preset.style.fontWeight,
                      color: preset.style.color,
                      backgroundColor: preset.style.hasBackgroundBox ? preset.style.boxColor : '#000000',
                      WebkitTextStroke: preset.style.strokeWidth ? `1px ${preset.style.strokeColor}` : 'none',
                    }}
                    className="mt-2 py-1 px-2 rounded-lg text-[11px] font-bold text-center truncate shadow-2xs"
                  >
                    {preset.previewText || 'CAPTION'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tactile Action Buttons Grid (Split, Merge, Insert, Delete) */}
      <div className="grid grid-cols-4 gap-2.5 pt-4 border-t border-zinc-100">
        <button
          onClick={() => currentCue && onSplitCaption?.(currentCue.id)}
          className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-2xl border border-zinc-200/90 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 transition-all cursor-pointer shadow-2xs active:scale-95"
          title="Split this caption into two parts"
        >
          <Scissors className="w-4 h-4 text-zinc-500" />
          <span className="text-[11px] font-bold">Split</span>
        </button>

        <button
          onClick={() => currentCue && onMergeCaption?.(currentCue.id)}
          className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-2xl border border-zinc-200/90 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 transition-all cursor-pointer shadow-2xs active:scale-95"
          title="Merge with next caption"
        >
          <GitMerge className="w-4 h-4 text-zinc-500" />
          <span className="text-[11px] font-bold">Merge</span>
        </button>

        <button
          onClick={onAddCaption}
          className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-2xl border border-zinc-200/90 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 transition-all cursor-pointer shadow-2xs active:scale-95"
          title="Insert new caption at playhead"
        >
          <Plus className="w-4 h-4 text-zinc-500" />
          <span className="text-[11px] font-bold">Insert</span>
        </button>

        <button
          onClick={() => currentCue && onDeleteCaption?.(currentCue.id)}
          className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-2xl border border-zinc-200/90 hover:bg-red-50 hover:border-red-200 text-zinc-700 hover:text-red-600 transition-all cursor-pointer shadow-2xs active:scale-95"
          title="Delete active caption"
        >
          <Trash2 className="w-4 h-4 text-zinc-400 group-hover:text-red-500" />
          <span className="text-[11px] font-bold">Delete</span>
        </button>
      </div>
    </div>
  );
}
