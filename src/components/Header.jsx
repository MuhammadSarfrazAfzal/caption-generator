import React, { useState } from 'react';
import { 
  FolderOpen, 
  RotateCcw, 
  RotateCw, 
  Sparkles, 
  Download, 
  ChevronDown,
  X,
  Minus,
  Square,
  Languages,
  Check,
  Database,
  Palette,
  Settings
} from 'lucide-react';

export function Header({
  fileName,
  projectTitle = 'rug-story',
  onUpdateTitle,
  captionCount = 0,
  onOpenVideo,
  onLoadDemo,
  onOpenProjects,
  onOpenSettings,
  onOpenExport,
  onGenerateCaptions,
  isGenerating,
  onToggleStyleStudio,
  isStyleStudioOpen,
  exportFormat = 'srt',
  onChangeExportFormat,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) {
  const [isFormatOpen, setIsFormatOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  const displayTitle = projectTitle || (fileName ? fileName.replace(/\.[^/.]+$/, '') : 'rug-story');

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim() && onUpdateTitle) {
      onUpdateTitle(tempTitle.trim());
    }
  };

  const formats = [
    { id: 'srt', label: '.srt' },
    { id: 'vtt', label: '.vtt' },
    { id: 'ass', label: '.ass' },
    { id: 'json', label: '.json' },
    { id: 'mp4', label: '.mp4 (Burned)' }
  ];

  const handleMinimize = () => window.electronAPI?.minimizeWindow?.();
  const handleMaximize = () => window.electronAPI?.maximizeWindow?.();
  const handleClose = () => window.electronAPI?.closeWindow?.();

  return (
    <header className="h-16 px-6 bg-white border-b border-zinc-200/80 flex items-center justify-between select-none rounded-t-[26px]">
      {/* Left: Project Title & Cues Subtitle */}
      <div className="flex items-center gap-3">
        <div>
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              autoFocus
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              className="text-sm font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded outline-none border border-lime-500 font-sans"
            />
          ) : (
            <h1 
              onClick={() => { setTempTitle(displayTitle); setIsEditingTitle(true); }}
              className="text-[15px] font-bold text-zinc-900 tracking-tight cursor-pointer hover:text-zinc-600 transition-colors"
              title="Click to rename project"
            >
              {displayTitle}
            </h1>
          )}
          <p className="text-xs text-zinc-400 font-medium tracking-tight">
            {captionCount} cues · SubRip (.{exportFormat || 'srt'})
          </p>
        </div>
      </div>

      {/* Center/Right: Action Icons, Format Pill, and Download Button */}
      <div className="flex items-center gap-2.5">
        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-lg transition-colors ${
            canUndo ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer' : 'text-zinc-300 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-lg transition-colors ${
            canRedo ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer' : 'text-zinc-300 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Upload Video / File */}
        <button
          onClick={onOpenVideo}
          className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          title="Open Video File"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        {/* AI Roman Urdu Transcription */}
        <button
          onClick={onGenerateCaptions}
          disabled={isGenerating}
          className={`p-1.5 rounded-lg transition-colors ${
            isGenerating ? 'text-lime-600 animate-spin bg-lime-50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          } cursor-pointer`}
          title="Generate Roman Urdu Captions with Gemini AI"
        >
          <Languages className="w-4 h-4" />
        </button>

        {/* Style Studio Toggle */}
        <button
          onClick={onToggleStyleStudio}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isStyleStudioOpen ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
          title="Toggle 16 CapCut Style Presets & Studio"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* Projects DB */}
        <button
          onClick={onOpenProjects}
          className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          title="Saved Projects Database"
        >
          <Database className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          title="Settings (API Key & Preferences)"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-zinc-200 mx-1" />

        {/* Format Selector Dropdown Pill (.srt) */}
        <div className="relative">
          <button
            onClick={() => setIsFormatOpen(!isFormatOpen)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold shadow-xs cursor-pointer"
          >
            <span>.{exportFormat}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {isFormatOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-zinc-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              {formats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onChangeExportFormat?.(f.id);
                    setIsFormatOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-lime-50 hover:text-zinc-900 cursor-pointer ${
                    exportFormat === f.id ? 'bg-lime-100/60 text-zinc-900 font-bold' : 'text-zinc-600'
                  }`}
                >
                  <span>{f.label}</span>
                  {exportFormat === f.id && <Check className="w-3 h-3 text-lime-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Primary CTA: Download Button (Vibrant Lime Green as in reference!) */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#bbf421] hover:bg-[#a3e635] text-zinc-950 font-bold text-xs tracking-tight shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Download</span>
        </button>

        {/* Window controls if Electron */}
        {window.electronAPI?.isElectron && (
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-zinc-200">
            <button
              onClick={handleMinimize}
              className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
              title="Minimize"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={handleMaximize}
              className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
              title="Maximize"
            >
              <Square className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={handleClose}
              className="p-1 rounded hover:bg-red-50 hover:text-red-500 text-zinc-400"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
