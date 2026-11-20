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
  Palette
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
  const cps = (charCount / durationSec).toFixed(1); // Characters per second
  const lineLength = Math.max(...text.split('\n').map(l => l.length), 0);

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
    <div className="flex-1 bg-white border-l border-zinc-200/80 flex flex-col justify-between p-5 select-none overflow-y-auto">
      <div className="space-y-4">
        {/* Cue Header with tabs */}
        <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-900 tracking-tight">
              Cue {cueNumber} of {safeCaptions.length}
            </span>
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={handlePrevCue}
                disabled={activeIndex <= 0}
                className="p-1 rounded hover:bg-zinc-100 text-zinc-500 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Previous Cue"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextCue}
                disabled={activeIndex >= safeCaptions.length - 1}
                className="p-1 rounded hover:bg-zinc-100 text-zinc-500 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Next Cue"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick tab between Editor & Presets */}
          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeTab === 'editor' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'presets' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Palette className="w-3 h-3 text-lime-600" />
              <span>Presets</span>
            </button>
          </div>
        </div>

        {activeTab === 'editor' ? (
          <>
            {/* Precision Timing Grid (3 Boxes as in reference image) */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Start Time Box */}
              <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[11px] font-medium text-zinc-400">Start</span>
                <span className="text-[12px] font-mono font-bold text-zinc-800 my-1 truncate">
                  {formatPreciseTime(currentCue?.start)}
                </span>
                <div className="flex items-center justify-between border-t border-zinc-200/60 pt-1.5 text-zinc-600">
                  <button
                    onClick={() => handleNudgeStart(-0.1)}
                    className="w-5 h-5 rounded hover:bg-zinc-200 flex items-center justify-center cursor-pointer"
                    title="-0.1s"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-zinc-300">|</span>
                  <button
                    onClick={() => handleNudgeStart(0.1)}
                    className="w-5 h-5 rounded hover:bg-zinc-200 flex items-center justify-center cursor-pointer"
                    title="+0.1s"
                  >
                    <PlusIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* End Time Box */}
              <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[11px] font-medium text-zinc-400">End</span>
                <span className="text-[12px] font-mono font-bold text-zinc-800 my-1 truncate">
                  {formatPreciseTime(currentCue?.end)}
                </span>
                <div className="flex items-center justify-between border-t border-zinc-200/60 pt-1.5 text-zinc-600">
                  <button
                    onClick={() => handleNudgeEnd(-0.1)}
                    className="w-5 h-5 rounded hover:bg-zinc-200 flex items-center justify-center cursor-pointer"
                    title="-0.1s"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-zinc-300">|</span>
                  <button
                    onClick={() => handleNudgeEnd(0.1)}
                    className="w-5 h-5 rounded hover:bg-zinc-200 flex items-center justify-center cursor-pointer"
                    title="+0.1s"
                  >
                    <PlusIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Duration Box */}
              <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[11px] font-medium text-zinc-400">Duration</span>
                <span className="text-[12px] font-mono font-bold text-zinc-800 my-1 truncate">
                  {formatDuration(currentCue?.start, currentCue?.end)}
                </span>
                <div className="h-5 flex items-center justify-center text-[10px] text-zinc-400 border-t border-zinc-200/60 pt-1">
                  Auto-calculated
                </div>
              </div>
            </div>

            {/* Quick Formatting Toolbar (I, B, U, Aa, Presets) */}
            <div className="flex items-center gap-1.5 text-zinc-600 text-xs">
              <button
                onClick={() => onUpdateStyle?.({ 
                  fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' 
                })}
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                  style.fontStyle === 'italic' 
                    ? 'bg-zinc-900 text-white border-zinc-900' 
                    : 'bg-white hover:bg-zinc-100 border-zinc-200'
                }`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onUpdateStyle?.({ 
                  fontWeight: style.fontWeight === '900' ? '600' : '900' 
                })}
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                  style.fontWeight === '900' 
                    ? 'bg-zinc-900 text-white border-zinc-900' 
                    : 'bg-white hover:bg-zinc-100 border-zinc-200'
                }`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onUpdateStyle?.({ 
                  textDecoration: style.textDecoration === 'underline' ? 'none' : 'underline' 
                })}
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                  style.textDecoration === 'underline' 
                    ? 'bg-zinc-900 text-white border-zinc-900' 
                    : 'bg-white hover:bg-zinc-100 border-zinc-200'
                }`}
                title="Underline"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onUpdateStyle?.({ 
                  textTransform: style.textTransform === 'uppercase' ? 'none' : 'uppercase' 
                })}
                className={`px-2 h-7 rounded-lg flex items-center gap-1 text-[11px] font-bold border transition-all cursor-pointer ${
                  style.textTransform === 'uppercase' 
                    ? 'bg-zinc-900 text-white border-zinc-900' 
                    : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                }`}
                title="Toggle UPPERCASE"
              >
                <span>Aa</span>
              </button>

              <button
                onClick={onOpenStyleStudio}
                className="ml-auto text-xs font-semibold text-zinc-700 hover:text-lime-700 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5 text-lime-600" />
                <span>Style Studio</span>
              </button>
            </div>

            {/* Main Cue Text Input Area */}
            <div>
              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder="Type or edit caption text here..."
                rows={3}
                className="w-full bg-white border border-zinc-300 rounded-xl p-3.5 text-zinc-800 text-[14px] leading-relaxed font-medium focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100 shadow-inner resize-none transition-all"
              />
            </div>

            {/* Reading Speed & Metrics (CPS, Line length, chars) */}
            <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between tracking-tight">
              <span>
                <strong className={Number(cps) > 17 ? 'text-amber-500 font-bold' : 'text-zinc-600'}>
                  {cps} CPS
                </strong> (max 17)
              </span>
              <span>•</span>
              <span>Line length <strong>{lineLength}</strong> (max 42)</span>
              <span>•</span>
              <span><strong>{charCount}</strong> characters</span>
            </div>
          </>
        ) : (
          /* Presets Quick Grid embedded right inside Inspector */
          <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
            <p className="text-xs text-zinc-500">
              Select any of the 16 CapCut & TikTok viral presets:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CAPCUT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onUpdateStyle?.(preset.style)}
                  className="p-2.5 rounded-xl border border-zinc-200 hover:border-lime-500 bg-white hover:bg-lime-50/40 text-left transition-all cursor-pointer shadow-xs group"
                >
                  <span className="text-[11px] font-bold text-zinc-800 block truncate group-hover:text-lime-700">
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
                    className="mt-1 px-1.5 py-0.5 rounded text-[11px] font-bold text-center truncate"
                  >
                    {preset.previewText || 'CAPTION'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Grid (Split, Merge, Insert, Delete) matching reference image */}
      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-zinc-100">
        <button
          onClick={() => currentCue && onSplitCaption?.(currentCue.id)}
          className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-zinc-200/90 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 transition-all cursor-pointer shadow-2xs"
          title="Split this caption into two"
        >
          <Scissors className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] font-bold">Split</span>
        </button>

        <button
          onClick={() => currentCue && onMergeCaption?.(currentCue.id)}
          className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-zinc-200/90 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 transition-all cursor-pointer shadow-2xs"
          title="Merge with next caption"
        >
          <GitMerge className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] font-bold">Merge</span>
        </button>

        <button
          onClick={onAddCaption}
          className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-zinc-200/90 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 transition-all cursor-pointer shadow-2xs"
          title="Insert new caption at playhead"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] font-bold">Insert</span>
        </button>

        <button
          onClick={() => currentCue && onDeleteCaption?.(currentCue.id)}
          className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-zinc-200/90 hover:bg-red-50 hover:border-red-200 text-zinc-700 hover:text-red-600 transition-all cursor-pointer shadow-2xs"
          title="Delete active caption"
        >
          <Trash2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-500" />
          <span className="text-[11px] font-bold">Delete</span>
        </button>
      </div>
    </div>
  );
}
