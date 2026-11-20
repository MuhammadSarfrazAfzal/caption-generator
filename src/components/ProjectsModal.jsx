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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 select-none">
      <div className="glass-modal w-full max-w-3xl max-h-[85vh] rounded-2xl border border-[#2b3044] overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#222634] flex items-center justify-between bg-[#11131a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Local Database Records</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  {projects.length} Saved
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#1f2230] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {projects.length > 0 && (
          <div className="px-6 py-3 border-b border-[#1c1f2b] bg-[#0e1017]">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search saved video projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#141620] border border-[#232736] rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* Project Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#0a0b0f]">
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center text-zinc-500">
              <Database className="w-10 h-10 text-zinc-600 mb-3" />
              <h3 className="text-sm font-semibold text-zinc-300 mb-1">
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
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-[#151926] border-cyan-500/70 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                        : 'bg-[#12141c] hover:bg-[#181a24] border-[#222534] hover:border-[#34384d]'
                    }`}
                  >
                    <div>
                      {/* Top Row: Thumbnail + Info */}
                      <div className="flex gap-3 mb-2.5">
                        {/* Thumbnail */}
                        <div className="w-20 h-14 rounded-lg bg-black border border-[#26293a] overflow-hidden flex items-center justify-center shrink-0 relative group-hover:scale-105 transition-transform">
                          {proj.thumbnail ? (
                            <img
                              src={proj.thumbnail}
                              alt="thumbnail"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Play className="w-5 h-5 text-cyan-400 opacity-60" />
                          )}
                          {proj.aspectRatio && (
                            <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-black/80 px-1 rounded text-zinc-300 font-mono">
                              {proj.aspectRatio}
                            </span>
                          )}
                        </div>

                        {/* Text Meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 truncate transition-colors">
                              {proj.title || proj.fileName || 'Untitled Project'}
                            </h4>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-semibold border border-cyan-800 shrink-0">
                                Active
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                            <span className="flex items-center gap-1 font-mono text-cyan-400">
                              <FileText className="w-3 h-3 text-cyan-500" />
                              {(proj.captions || []).length} Captions
                            </span>
                            {proj.duration > 0 && (
                              <span className="flex items-center gap-1 font-mono text-zinc-400">
                                <Clock className="w-3 h-3 text-zinc-500" />
                                {formatDuration(proj.duration)}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-zinc-500 truncate mt-1">
                            {proj.captions?.[0]?.text || 'No caption text preview'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Date & Delete button */}
                    <div className="pt-2 border-t border-[#1d202d] flex items-center justify-between text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
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
                          className="p-1 rounded hover:bg-red-950/70 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete from local database"
                        >
                          <Trash2 className="w-3 h-3" />
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
        <div className="px-6 py-3 bg-[#11131a] border-t border-[#222634] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Auto-saving enabled: All edits are instantly written to the local database</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#1a1d28] hover:bg-[#232736] text-zinc-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
