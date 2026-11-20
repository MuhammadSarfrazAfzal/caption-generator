import React, { useState } from 'react';
import { 
  X, 
  FolderOpen, 
  Database, 
  Trash2, 
  Play, 
  Clock, 
  FileText, 
  Layers, 
  Search, 
  Plus, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

export function ProjectsModal({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onLoadProject,
  onDeleteProject,
  onNewProject
}) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = projects.filter(p => 
    (p.title || p.fileName || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (isoString) => {
    if (!isoString) return 'Recently';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return isoString;
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-6 select-none">
      <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl border border-zinc-200/90 overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-zinc-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-lime-100/80 border border-lime-300 flex items-center justify-center text-lime-800">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                <span>Local Project Database</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 font-mono font-bold">
                  {projects.length} Saved
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium">
                All video transcriptions, captions, styles, and positions are stored locally on your machine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#bbf421] hover:bg-[#a3e635] text-zinc-950 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {projects.length > 0 && (
          <div className="px-6 py-3 border-b border-zinc-100 bg-zinc-50/60">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search saved video projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-lime-500 shadow-2xs"
              />
            </div>
          </div>
        )}

        {/* Project Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-zinc-50/40">
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center text-zinc-400">
              <Database className="w-10 h-10 text-zinc-300 mb-3" />
              <h3 className="text-sm font-bold text-zinc-800 mb-1">
                {search ? 'No matching projects found' : 'No saved video records yet'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-4">
                Whenever you upload a video or generate Roman Urdu captions, your project is automatically saved to the local database.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filtered.map((proj) => {
                const isCurrent = proj.id === activeProjectId;
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      onLoadProject(proj);
                      onClose();
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between shadow-2xs ${
                      isCurrent
                        ? 'bg-lime-50/20 border-lime-500 ring-1 ring-lime-400/30'
                        : 'bg-white hover:bg-zinc-50/80 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      {/* Top Row: Thumbnail + Info */}
                      <div className="flex gap-3 mb-3">
                        {/* Thumbnail */}
                        <div className="w-20 h-14 rounded-xl bg-black border border-zinc-200 overflow-hidden flex items-center justify-center shrink-0 relative group-hover:scale-102 transition-transform shadow-2xs">
                          {proj.thumbnail ? (
                            <img
                              src={proj.thumbnail}
                              alt="thumbnail"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Play className="w-5 h-5 text-white opacity-60" />
                          )}
                          {proj.aspectRatio && (
                            <span className="absolute bottom-1 right-1 text-[8px] bg-black/80 px-1 py-0.2 rounded text-zinc-200 font-mono">
                              {proj.aspectRatio}
                            </span>
                          )}
                        </div>

                        {/* Text Meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-bold text-zinc-900 group-hover:text-lime-700 truncate transition-colors">
                              {proj.title || proj.fileName || 'Untitled Project'}
                            </h4>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-lime-100 text-lime-900 font-bold border border-lime-300 shrink-0">
                                Active
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-500">
                            <span className="flex items-center gap-1 font-mono font-medium text-zinc-700">
                              <FileText className="w-3 h-3 text-zinc-400" />
                              {(proj.captions || []).length} Captions
                            </span>
                            {proj.duration > 0 && (
                              <span className="flex items-center gap-1 font-mono text-zinc-400">
                                <Clock className="w-3 h-3 text-zinc-400" />
                                {formatDuration(proj.duration)}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-zinc-400 truncate mt-1">
                            {proj.captions?.[0]?.text || 'No caption text preview'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Date & Delete button */}
                    <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        {formatDate(proj.updatedAt)}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete project "${proj.title || proj.fileName}" from database?`)) {
                              onDeleteProject(proj.id);
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                          title="Delete from local database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-zinc-50/70 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Auto-saving enabled: All edits are instantly written to the local database</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-2xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
