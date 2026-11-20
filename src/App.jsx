import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { QuickRibbon } from './components/QuickRibbon';
import { VideoPlayer } from './components/VideoPlayer';
import { CueInspector } from './components/CueInspector';
import { StyleStudio } from './components/StyleStudio';
import { TimelineBar } from './components/TimelineBar';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { ProjectsModal } from './components/ProjectsModal';
import { CAPCUT_PRESETS } from './utils/stylePresets';
import { extractAudioFromVideo } from './utils/audioExtractor';
import { generateRomanUrduCaptions } from './utils/geminiTranscriber';
import { SAMPLE_ROMAN_URDU_CAPTIONS, createDemoVideoBlob } from './utils/sampleData';
import { saveProjectToDb, getProjectsFromDb, deleteProjectFromDb, captureVideoThumbnail } from './utils/localDatabase';
import { Keyboard, X, Search, Replace } from 'lucide-react';

const DEFAULT_GEMINI_KEY = 'AIzaSyCDSZ60J2PVaivfcpyUf7LHdQ7R_LOcL4w';

export default function App() {
  // Video and Media state
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [filePath, setFilePath] = useState('');
  const [fileName, setFileName] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [aspectRatioMode, setAspectRatioMode] = useState('auto');
  const [aspectRatioText, setAspectRatioText] = useState('');
  const [showSafeZone, setShowSafeZone] = useState(false);

  // Captions & Styling State
  const [captions, setCaptions] = useState([]);
  const [style, setStyle] = useState(CAPCUT_PRESETS[0].style); // CapCut Viral Yellow
  const [position, setPosition] = useState({ x: 50, y: 84 });
  const [displayMode, setDisplayMode] = useState('karaoke'); // 'karaoke' or 'line'
  const [exportFormat, setExportFormat] = useState('srt');

  // History for Undo / Redo
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  // Local Database & Projects State
  const [projectId, setProjectId] = useState(() => 'proj_' + Date.now());
  const [projectTitle, setProjectTitle] = useState('rug-story');
  const [projectsList, setProjectsList] = useState([]);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isDbSaved, setIsDbSaved] = useState(false);

  // Modals & Panels
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isStyleStudioOpen, setIsStyleStudioOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('capscribe_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          apiKey: parsed.apiKey || DEFAULT_GEMINI_KEY,
          provider: parsed.provider || 'gemini',
          model: parsed.model || 'gemini-2.5-flash',
        };
      }
      return { apiKey: DEFAULT_GEMINI_KEY, provider: 'gemini', model: 'gemini-2.5-flash', customPrompt: '' };
    } catch {
      return { apiKey: DEFAULT_GEMINI_KEY, provider: 'gemini', model: 'gemini-2.5-flash', customPrompt: '' };
    }
  });

  // Load existing projects from database on startup
  const refreshProjectsList = useCallback(async () => {
    try {
      const list = await getProjectsFromDb();
      setProjectsList(list);
    } catch (err) {
      console.warn('Could not load projects from DB:', err);
    }
  }, []);

  useEffect(() => {
    refreshProjectsList();
  }, [refreshProjectsList]);

  // Active caption
  const activeCaption = useMemo(() => {
    return captions.find(c => currentTime >= c.start && currentTime <= c.end) || captions[0] || null;
  }, [captions, currentTime]);

  // Auto-Save project to Local Database
  const autoSaveTimerRef = useRef(null);
  const saveCurrentToDb = useCallback(async () => {
    if (!videoSrc && captions.length === 0) return;

    try {
      let thumb = null;
      if (videoRef.current) {
        thumb = captureVideoThumbnail(videoRef.current);
      }

      const projectRecord = {
        id: projectId,
        title: projectTitle || fileName || 'rug-story',
        fileName: fileName || 'video.mp4',
        filePath: filePath || '',
        duration: duration || 0,
        aspectRatio: aspectRatioMode,
        thumbnail: thumb,
        captions: captions,
        style: style,
        position: position,
        displayMode: displayMode,
        captionCount: captions.length
      };

      await saveProjectToDb(projectRecord);
      setIsDbSaved(true);
      refreshProjectsList();
    } catch (err) {
      console.error('Auto-save error:', err);
    }
  }, [projectId, projectTitle, fileName, filePath, duration, aspectRatioMode, captions, style, position, displayMode, videoSrc, refreshProjectsList]);

  // Debounced auto-save trigger
  useEffect(() => {
    if (!videoSrc && captions.length === 0) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveCurrentToDb();
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [captions, style, position, displayMode, fileName, duration, saveCurrentToDb, videoSrc]);

  // Video timeupdate and metadata listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w && h) {
        const ratio = (w / h).toFixed(2);
        setAspectRatioText(`${w}x${h} (${ratio > 1 ? '16:9' : ratio < 1 ? '9:16' : '1:1'})`);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoSrc]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(Math.max(0, currentTime - 3));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeek(Math.min(duration, currentTime + 3));
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, duration, history, future]);

  // Undo / Redo implementation
  const updateCaptionsWithHistory = (newCaptions) => {
    setHistory(h => [...h.slice(-25), captions]);
    setFuture([]);
    setCaptions(newCaptions);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setFuture(f => [captions, ...f]);
    setCaptions(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(f => f.slice(1));
    setHistory(h => [...h, captions]);
    setCaptions(next);
  };

  // Video loading
  const handleOpenVideo = async () => {
    try {
      if (window.electronAPI?.openVideoDialog) {
        const result = await window.electronAPI.openVideoDialog();
        if (result && result.base64Data) {
          const binary = atob(result.base64Data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes.buffer], { type: result.mimeType || 'video/mp4' });
          const url = URL.createObjectURL(blob);
          
          setVideoSrc(url);
          setFileName(result.fileName);
          setFilePath(result.filePath || '');
          setVideoFile(blob);
          setProjectId('proj_' + Date.now());
          setProjectTitle(result.fileName.replace(/\.[^/.]+$/, ''));
          return;
        }
      }
      fileInputRef.current?.click();
    } catch (err) {
      console.error('File dialog error:', err);
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoFile(file);
      setFileName(file.name);
      setProjectId('proj_' + Date.now());
      setProjectTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoFile(file);
      setFileName(file.name);
      setProjectId('proj_' + Date.now());
      setProjectTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  // Demo Video Loader
  const handleLoadDemo = async () => {
    try {
      setIsGenerating(true);
      setGenerationProgress('Synthesizing high-res 9:16 demo video in memory...');
      const demoBlob = await createDemoVideoBlob();
      const demoUrl = URL.createObjectURL(demoBlob);
      setVideoSrc(demoUrl);
      setVideoFile(demoBlob);
      const name = 'Pakistani_Vlog_RomanUrdu_Demo.mp4';
      setFileName(name);
      setProjectId('demo_' + Date.now());
      setProjectTitle('rug-story');
      updateCaptionsWithHistory(SAMPLE_ROMAN_URDU_CAPTIONS);
      setAspectRatioMode('9:16');
      setShowSafeZone(true);
      setIsGenerating(false);
      setGenerationProgress('');
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      alert('Could not generate demo: ' + err.message);
    }
  };

  const handleLoadProject = (proj) => {
    setProjectId(proj.id);
    setProjectTitle(proj.title || proj.fileName);
    setFileName(proj.fileName);
    if (proj.filePath) setFilePath(proj.filePath);
    if (proj.aspectRatio) setAspectRatioMode(proj.aspectRatio);
    if (proj.captions) setCaptions(proj.captions);
    if (proj.style) setStyle(proj.style);
    if (proj.position) setPosition(proj.position);
    if (proj.displayMode) setDisplayMode(proj.displayMode);
    if (proj.duration) setDuration(proj.duration);
  };

  const handleDeleteProject = async (id) => {
    await deleteProjectFromDb(id);
    refreshProjectsList();
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(e => console.warn('Play error:', e));
    } else {
      videoRef.current.pause();
    }
  };

  const handleSeek = (newTime) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
    }
  };

  // Caption Editing Handlers
  const handleUpdateCaption = (id, updateOrText) => {
    updateCaptionsWithHistory(captions.map(c => {
      if (c.id === id) {
        if (typeof updateOrText === 'string') {
          const words = updateOrText.split(/\s+/).filter(Boolean);
          const wordDur = words.length > 0 ? (c.end - c.start) / words.length : 0.5;
          const newWords = words.map((w, i) => ({
            word: w,
            start: Number((c.start + i * wordDur).toFixed(2)),
            end: Number((c.start + (i + 1) * wordDur).toFixed(2))
          }));
          return { ...c, text: updateOrText, words: newWords };
        } else {
          const updated = { ...c, ...updateOrText };
          if (updateOrText.text && !updateOrText.words) {
            const words = updateOrText.text.split(/\s+/).filter(Boolean);
            const wordDur = words.length > 0 ? (updated.end - updated.start) / words.length : 0.5;
            updated.words = words.map((w, i) => ({
              word: w,
              start: Number((updated.start + i * wordDur).toFixed(2)),
              end: Number((updated.start + (i + 1) * wordDur).toFixed(2))
            }));
          }
          return updated;
        }
      }
      return c;
    }));
  };

  const handleDeleteCaption = (id) => {
    updateCaptionsWithHistory(captions.filter(c => c.id !== id));
  };

  const handleAddCaptionAtCurrent = () => {
    const start = Number(currentTime.toFixed(2));
    const end = Number(Math.min(duration || 100, currentTime + 2.5).toFixed(2));
    const newCap = {
      id: Date.now(),
      start,
      end,
      text: "Naya Roman Urdu caption",
      words: [
        { word: "Naya", start: start, end: start + 0.8 },
        { word: "Roman", start: start + 0.8, end: start + 1.6 },
        { word: "Urdu", start: start + 1.6, end: end }
      ]
    };

    updateCaptionsWithHistory([...captions, newCap].sort((a, b) => a.start - b.start));
  };

  const handleSplitCaption = (id) => {
    const target = captions.find(c => c.id === id);
    if (!target) return;

    const mid = (target.start + target.end) / 2;
    const words = target.text.split(' ');
    const half = Math.ceil(words.length / 2);
    const text1 = words.slice(0, half).join(' ');
    const text2 = words.slice(half).join(' ');

    const cap1 = { ...target, end: Number(mid.toFixed(2)), text: text1 };
    const cap2 = {
      id: Date.now(),
      start: Number(mid.toFixed(2)),
      end: target.end,
      text: text2
    };

    updateCaptionsWithHistory(captions.flatMap(c => c.id === id ? [cap1, cap2] : [c]));
  };

  const handleMergeCaption = (id) => {
    const idx = captions.findIndex(c => c.id === id);
    if (idx === -1 || idx >= captions.length - 1) return;
    const current = captions[idx];
    const next = captions[idx + 1];
    const merged = {
      ...current,
      end: next.end,
      text: `${current.text} ${next.text}`.trim(),
      words: [...(current.words || []), ...(next.words || [])]
    };
    const nextList = [...captions];
    nextList.splice(idx, 2, merged);
    updateCaptionsWithHistory(nextList);
  };

  // Fix and Check (Auto format & split to 3 words)
  const handleFixAndCheck = () => {
    const fixed = captions.map(c => {
      let t = (c.text || '').trim();
      if (t.length > 0) t = t.charAt(0).toUpperCase() + t.slice(1);
      return { ...c, text: t };
    });
    updateCaptionsWithHistory(fixed);
  };

  // Find & Replace Handler
  const handleApplyFindReplace = () => {
    if (!findText) return;
    const regex = new RegExp(findText, 'gi');
    const updated = captions.map(c => ({
      ...c,
      text: (c.text || '').replace(regex, replaceText)
    }));
    updateCaptionsWithHistory(updated);
    setIsFindReplaceOpen(false);
  };

  // Gemini Caption Generation Trigger
  const handleGenerateCaptions = async () => {
    if (!videoSrc) {
      alert('Please upload a video file first.');
      return;
    }

    const keyToUse = settings.apiKey || DEFAULT_GEMINI_KEY;

    try {
      setIsGenerating(true);
      setGenerationProgress('Extracting audio track into 16kHz mono...');

      const audioData = await extractAudioFromVideo(
        videoFile || videoSrc,
        (msg) => setGenerationProgress(msg)
      );

      setGenerationProgress('Google Gemini AI is transcribing speech into Roman Urdu...');
      const generated = await generateRomanUrduCaptions({
        base64Audio: audioData.base64Audio,
        apiKey: keyToUse,
        provider: settings.provider,
        model: settings.model,
        customPrompt: settings.customPrompt,
        onProgress: (msg) => setGenerationProgress(msg)
      });

      updateCaptionsWithHistory(generated);
      setIsGenerating(false);
      setGenerationProgress('');
      saveCurrentToDb();
    } catch (err) {
      console.error('Caption generation error:', err);
      setIsGenerating(false);
      setGenerationProgress('');
      alert('Caption generation failed: ' + err.message);
    }
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('capscribe_settings', JSON.stringify(newSettings));
  };

  return (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="h-screen w-screen p-4 md:p-6 flex items-center justify-center font-sans select-none overflow-hidden"
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
        className="hidden"
      />

      {/* Main App Container Card (Exact match to reference image aesthetic!) */}
      <div className="w-full h-full max-w-[1440px] app-window-card rounded-[28px] flex flex-col overflow-hidden relative shadow-2xl">
        
        {/* Top Header Bar */}
        <Header
          fileName={fileName}
          projectTitle={projectTitle}
          onUpdateTitle={setProjectTitle}
          captionCount={captions.length}
          onOpenVideo={handleOpenVideo}
          onLoadDemo={handleLoadDemo}
          onOpenProjects={() => setIsProjectsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onGenerateCaptions={handleGenerateCaptions}
          isGenerating={isGenerating}
          onToggleStyleStudio={() => setIsStyleStudioOpen(!isStyleStudioOpen)}
          isStyleStudioOpen={isStyleStudioOpen}
          exportFormat={exportFormat}
          onChangeExportFormat={setExportFormat}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.length > 0}
          canRedo={future.length > 0}
        />

        {/* Quick Action Ribbon Bar (Timing, Fix & check, Find & replace, Export, Burn, Shortcuts) */}
        <QuickRibbon
          onOpenExport={() => setIsExportOpen(true)}
          onBurnIntoVideo={() => setIsExportOpen(true)}
          onOpenStyleStudio={() => setIsStyleStudioOpen(true)}
          onFixAndCheck={handleFixAndCheck}
          onFindAndReplace={() => setIsFindReplaceOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenTiming={() => {}}
          isSaved={isDbSaved}
        />

        {/* Middle Stage: 2-Column Layout (Video Player on Left, Cue Inspector on Right) */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Left: Video Viewport Stage */}
          <VideoPlayer
            videoSrc={videoSrc}
            videoRef={videoRef}
            captions={captions}
            activeCaption={activeCaption}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            volume={volume}
            style={style}
            onUpdateStyle={(updated) => setStyle(prev => ({ ...prev, ...updated }))}
            position={position}
            onPositionChange={setPosition}
            displayMode={displayMode}
            onUploadClick={handleOpenVideo}
            showSafeZone={showSafeZone}
            onToggleSafeZone={() => setShowSafeZone(!showSafeZone)}
            aspectRatioMode={aspectRatioMode}
            onChangeAspectRatio={setAspectRatioMode}
          />

          {/* Right: Cue Inspector & Precision Editor Card */}
          <CueInspector
            captions={captions}
            activeCaption={activeCaption}
            activeCaptionId={activeCaption?.id}
            currentTime={currentTime}
            onUpdateCaption={handleUpdateCaption}
            onDeleteCaption={handleDeleteCaption}
            onAddCaption={handleAddCaptionAtCurrent}
            onSplitCaption={handleSplitCaption}
            onMergeCaption={handleMergeCaption}
            onSeek={handleSeek}
            style={style}
            onUpdateStyle={(updated) => setStyle(prev => ({ ...prev, ...updated }))}
            onOpenStyleStudio={() => setIsStyleStudioOpen(true)}
          />

          {/* Optional Slide-out Style Studio Drawer */}
          {isStyleStudioOpen && (
            <div className="absolute top-0 right-0 bottom-0 z-30 shadow-2xl animate-in slide-in-from-right duration-200">
              <StyleStudio
                style={style}
                onUpdateStyle={(updated) => setStyle(prev => ({ ...prev, ...updated }))}
                position={position}
                onUpdatePosition={setPosition}
                displayMode={displayMode}
                onChangeDisplayMode={setDisplayMode}
                onClose={() => setIsStyleStudioOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Bottom: Waveform Timeline Bar (Ruler, Gray Peaks, Lime Active Cue & Red Playhead) */}
        <TimelineBar
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          captions={captions}
          activeCaptionId={activeCaption?.id}
          onUpdateCaption={handleUpdateCaption}
          onAddCaptionAtPlayhead={handleAddCaptionAtCurrent}
        />
      </div>

      {/* Shortcuts Modal */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2 font-bold text-sm text-zinc-900">
                <Keyboard className="w-4 h-4 text-lime-600" />
                <span>Keyboard Shortcuts</span>
              </div>
              <button
                onClick={() => setIsShortcutsOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 pt-3 text-xs text-zinc-600 font-medium">
              <div className="flex justify-between items-center">
                <span>Play / Pause</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-100 font-mono text-zinc-800 border border-zinc-200 font-bold">Space</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Seek Back 3s</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-100 font-mono text-zinc-800 border border-zinc-200 font-bold">← Left Arrow</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Seek Forward 3s</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-100 font-mono text-zinc-800 border border-zinc-200 font-bold">→ Right Arrow</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Undo</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-100 font-mono text-zinc-800 border border-zinc-200 font-bold">Ctrl + Z</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Redo</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-100 font-mono text-zinc-800 border border-zinc-200 font-bold">Ctrl + Y</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Find & Replace Modal */}
      {isFindReplaceOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2 font-bold text-sm text-zinc-900">
                <Search className="w-4 h-4 text-lime-600" />
                <span>Find & Replace</span>
              </div>
              <button
                onClick={() => setIsFindReplaceOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 pt-3">
              <div>
                <label className="text-xs font-semibold text-zinc-600 block mb-1">Find text</label>
                <input
                  type="text"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder="e.g. ap"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-lime-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 block mb-1">Replace with</label>
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="e.g. aap"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-lime-500"
                />
              </div>
              <button
                onClick={handleApplyFindReplace}
                className="w-full py-2 rounded-xl bg-[#bbf421] hover:bg-[#a3e635] text-zinc-950 font-bold text-xs tracking-tight shadow-sm cursor-pointer mt-2"
              >
                Replace All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Modal */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        projects={projectsList}
        activeProjectId={projectId}
        onLoadProject={handleLoadProject}
        onDeleteProject={handleDeleteProject}
        onNewProject={() => {
          setProjectId('proj_' + Date.now());
          setProjectTitle('rug-story');
          setCaptions([]);
          setVideoSrc(null);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        captions={captions}
        style={style}
        position={position}
        displayMode={displayMode}
        videoRef={videoRef}
        fileName={projectTitle || fileName || 'rug-story'}
        filePath={filePath}
      />
    </div>
  );
}
