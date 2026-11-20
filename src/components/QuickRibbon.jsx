import React from 'react';
import { 
  Clock, 
  Wand2, 
  Search, 
  FileText, 
  Film, 
  Keyboard, 
  Palette,
  CheckCircle2
} from 'lucide-react';

export function QuickRibbon({
  onOpenExport,
  onBurnIntoVideo,
  onOpenStyleStudio,
  onFixAndCheck,
  onFindAndReplace,
  onOpenShortcuts,
  onOpenTiming,
  isSaved = true
}) {
  return (
    <div className="h-12 px-10 bg-white border-b border-zinc-200/80 flex items-center justify-between text-xs text-zinc-600 select-none">
      {/* Left Tool Ribbon Items */}
      <div className="flex items-center gap-7 font-medium">
        <button 
          onClick={onOpenTiming}
          className="flex items-center gap-1.5 hover:text-zinc-950 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>Timing</span>
        </button>

        <button 
          onClick={onFixAndCheck}
          className="flex items-center gap-1.5 hover:text-zinc-950 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          title="Auto-fix punctuation, short 3-words split & Roman Urdu formatting"
        >
          <Wand2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>Fix & check</span>
        </button>

        <button 
          onClick={onFindAndReplace}
          className="flex items-center gap-1.5 hover:text-zinc-950 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span>Find & replace</span>
        </button>

        <button 
          onClick={onOpenExport}
          className="flex items-center gap-1.5 hover:text-zinc-950 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-zinc-400" />
          <span>Export</span>
        </button>

        <button 
          onClick={onBurnIntoVideo}
          className="flex items-center gap-1.5 text-zinc-900 font-semibold hover:text-lime-700 px-2 py-1 rounded-lg hover:bg-lime-50 transition-colors cursor-pointer"
          title="Hardware-accelerated native FFmpeg Video Burn"
        >
          <Film className="w-3.5 h-3.5 text-lime-600" />
          <span>Burn into video</span>
        </button>

        <button 
          onClick={onOpenStyleStudio}
          className="flex items-center gap-1.5 hover:text-zinc-950 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          title="Open CapCut Presets & Styling Studio"
        >
          <Palette className="w-3.5 h-3.5 text-zinc-400" />
          <span>Presets & Style</span>
        </button>

        <button 
          onClick={onOpenShortcuts}
          className="flex items-center gap-1.5 hover:text-zinc-950 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <Keyboard className="w-3.5 h-3.5 text-zinc-400" />
          <span>Shortcuts</span>
        </button>
      </div>

      {/* Right Saved Status Indicator */}
      <div className="flex items-center gap-2 text-zinc-400 font-medium text-[11px]">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span>Saved in this app</span>
      </div>
    </div>
  );
}
