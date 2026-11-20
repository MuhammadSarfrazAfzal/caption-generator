import React from 'react';
import { 
  Sparkles, 
  FolderOpen, 
  Settings, 
  Download, 
  Video, 
  PlayCircle,
  Database,
  Minus,
  Square,
  X,
  Check
} from 'lucide-react';

export function Header({
  fileName,
  aspectRatio,
  onOpenVideo,
  onLoadDemo,
  onOpenProjects,
  projectCount = 0,
  isSaved,
  onOpenSettings,
  onOpenExport,
  onGenerateCaptions,
  isGenerating,
  hasVideo,
  hasCaptions,
  apiKeySet
}) {
  const isElectron = window.electronAPI?.isElectron;

  const handleMinimize = () => window.electronAPI?.minimizeWindow?.();
  const handleMaximize = () => window.electronAPI?.maximizeWindow?.();
  const handleClose = () => window.electronAPI?.closeWindow?.();

  return (
    <header className="h-14 bg-[#101219] border-b border-[#1f2230] flex items-center justify-between px-4 z-30 select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-cyan-400 via-teal-300 to-yellow-300 bg-clip-text text-transparent">
            CAPSCRIBE
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            Roman Urdu
          </span>
        </div>

        {/* Database Projects Button */}
        <button
          onClick={onOpenProjects}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#181c28] hover:bg-[#222738] text-zinc-300 border border-[#2b3042] transition-all cursor-pointer"
          title="Open Local Database & Saved Projects"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Projects</span>
          {projectCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-400 font-mono border border-cyan-800">
              {projectCount}
            </span>
          )}
        </button>

        {fileName && (
          <div className="flex items-center gap-2 pl-3 border-l border-[#272a38]">
            <Video className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-300 font-medium max-w-[180px] truncate" title={fileName}>
              {fileName}
            </span>
            {aspectRatio && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f2230] text-zinc-400 font-mono">
                {aspectRatio}
              </span>
            )}
            {/* Auto-saved badge */}
            <span className="flex items-center gap-1 text-[10px] text-emerald-400/90 font-mono">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Saved</span>
            </span>
          </div>
        )}
      </div>

      {/* Main Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenVideo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#1d212d] hover:bg-[#272c3d] text-zinc-200 border border-[#31364a] transition-all cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span>Upload Video</span>
        </button>

        <button
          onClick={onLoadDemo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#181c28] hover:bg-[#222738] text-zinc-300 border border-[#2c3144] transition-all cursor-pointer"
          title="Load Pakistani Roman Urdu Demo Video & Captions"
        >
          <PlayCircle className="w-3.5 h-3.5 text-yellow-400" />
          <span>Try Demo</span>
        </button>

        {hasVideo && (
          <button
            onClick={onGenerateCaptions}
            disabled={isGenerating}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              isGenerating
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-700 opacity-80 cursor-wait'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-lg shadow-cyan-500/20'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating Roman Urdu...' : 'Generate Captions'}</span>
          </button>
        )}

        <button
          onClick={onOpenExport}
          disabled={!hasCaptions}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
            hasCaptions
              ? 'bg-[#182a24] hover:bg-[#1e382f] text-emerald-300 border-emerald-600/40 shadow-sm'
              : 'bg-[#161821] text-zinc-600 border-[#222634] cursor-not-allowed opacity-50'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export</span>
        </button>

        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
            apiKeySet
              ? 'bg-[#1a1d28] hover:bg-[#25293a] text-zinc-300 border-[#2f3448]'
              : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-600/50 animate-pulse'
          }`}
          title={apiKeySet ? 'Settings (Gemini Key Ready)' : 'Setup Gemini API Key'}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Electron Window Controls */}
      {isElectron && (
        <div className="flex items-center gap-1 pl-4 ml-2 border-l border-[#272a38]">
          <button 
            onClick={handleMinimize}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#222634] text-zinc-400 hover:text-white transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleMaximize}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#222634] text-zinc-400 hover:text-white transition-colors"
          >
            <Square className="w-3 h-3" />
          </button>
          <button 
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-600/80 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
}
