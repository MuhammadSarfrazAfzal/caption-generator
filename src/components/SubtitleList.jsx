import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Search, 
  Clock, 
  Play, 
  Split, 
  FileText,
  AlertCircle
} from 'lucide-react';

export function SubtitleList({
  captions = [],
  activeCaptionId,
  currentTime,
  onUpdateCaption,
  onDeleteCaption,
  onAddCaption,
  onSplitCaption,
  onSeek,
  onGenerateCaptions,
  isGenerating,
  generationProgress
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const activeItemRef = useRef(null);

  // Auto-scroll to active caption during playback (only when not actively typing)
  useEffect(() => {
    if (activeItemRef.current && document.activeElement?.tagName !== 'TEXTAREA') {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [activeCaptionId]);

  const safeCaptions = Array.isArray(captions) ? captions : [];
  const filteredCaptions = safeCaptions.filter(c => {
    const text = String(c?.text || '').toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  const formatBadgeTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00.0';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  return (
    <aside className="w-80 bg-[#101218] border-r border-[#1f2230] flex flex-col h-full z-10 select-none">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-[#1f2230] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Captions Editor
          </h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1b1e2a] text-cyan-400 font-mono">
            {safeCaptions.length}
          </span>
        </div>

        <button
          onClick={onAddCaption}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1a1e2b] hover:bg-[#252b3e] text-zinc-300 hover:text-cyan-300 text-xs font-medium border border-[#272d40] transition-colors cursor-pointer"
          title="Add caption line at current playhead"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Generation Status Banner if in progress */}
      {isGenerating && (
        <div className="p-3 bg-cyan-950/40 border-b border-cyan-800/40 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-medium">
            <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Generating Roman Urdu Captions...</span>
          </div>
          <p className="text-[11px] text-cyan-400/80 font-mono truncate">
            {generationProgress || 'Listening to speech and aligning words...'}
          </p>
          <div className="w-full bg-cyan-950 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full w-2/3 animate-pulse rounded-full" />
          </div>
        </div>
      )}

      {/* Search Input */}
      {safeCaptions.length > 0 && (
        <div className="p-2.5 border-b border-[#1b1e29]">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Roman Urdu words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151722] border border-[#242738] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      )}

      {/* Subtitles Scrollable List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {safeCaptions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-zinc-500">
            <AlertCircle className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-xs font-medium text-zinc-400 mb-1">No captions yet</p>
            <p className="text-[11px] text-zinc-500 max-w-[200px] mb-4">
              Click Generate Captions or Add to create your Roman Urdu subtitles.
            </p>
            <button
              onClick={onGenerateCaptions}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Now</span>
            </button>
          </div>
        ) : (
          filteredCaptions.map((cap) => {
            const isActive = cap.id === activeCaptionId;
            return (
              <div
                key={cap.id}
                ref={isActive ? activeItemRef : null}
                className={`p-2.5 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-[#181c28] border-cyan-500/70 shadow-lg shadow-cyan-500/10'
                    : 'bg-[#14161f] hover:bg-[#181b26] border-[#222534]'
                }`}
              >
                {/* Timestamp & Controls Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <button
                    onClick={() => onSeek(cap.start || 0)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1f2332] hover:bg-cyan-950 text-cyan-400 hover:text-cyan-300 font-mono text-[10px] border border-[#2b3145] transition-colors cursor-pointer"
                    title="Seek video to start time"
                  >
                    <Clock className="w-2.5 h-2.5 text-zinc-400" />
                    <span>{formatBadgeTime(cap.start || 0)} ➔ {formatBadgeTime(cap.end || 0)}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSeek(cap.start || 0)}
                      className="p-1 rounded hover:bg-[#252a3d] text-zinc-400 hover:text-cyan-300 transition-colors"
                      title="Play this segment"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onSplitCaption(cap.id)}
                      className="p-1 rounded hover:bg-[#252a3d] text-zinc-400 hover:text-yellow-300 transition-colors"
                      title="Split caption into two lines"
                    >
                      <Split className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteCaption(cap.id)}
                      className="p-1 rounded hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Delete caption"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Editable Roman Urdu Textarea */}
                <textarea
                  rows={2}
                  value={cap.text || ''}
                  onChange={(e) => onUpdateCaption(cap.id, e.target.value)}
                  className="w-full bg-[#0d0f15] hover:bg-[#11131c] focus:bg-[#11131c] border border-[#252838] focus:border-cyan-500/60 rounded px-2 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none transition-colors"
                  placeholder="Type Roman Urdu caption..."
                />
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
