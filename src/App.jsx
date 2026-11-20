import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { SubtitleList } from './components/SubtitleList';
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

  // Local Database & Projects State
  const [projectId, setProjectId] = useState(() => 'proj_' + Date.now());
  const [projectTitle, setProjectTitle] = useState('');
  const [projectsList, setProjectsList] = useState([]);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isDbSaved, setIsDbSaved] = useState(false);

  // Generation & AI Settings
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
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

  // Calculate active caption for current playback time
  const activeCaption = useMemo(() => {
    return captions.find(c => currentTime >= c.start && currentTime <= c.end) || null;
  }, [captions, currentTime]);

  // Auto-Save project to Local Database whenever captions, style, or position change
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
        title: projectTitle || fileName || 'Roman Urdu Caption Project',
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
  }, [projectId, projectTitle, fileName, duration, aspectRatioMode, captions, style, position, displayMode, videoSrc, refreshProjectsList]);

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

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

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

  // Global Keyboard Shortcuts (Space for Play/Pause)
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, duration]);

  // Crash-proof File loading handler
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
          setProjectTitle(result.fileName);
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
      setProjectTitle(file.name);
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
      setProjectTitle(file.name);
    }
  };

  // Load interactive demo video & sample captions
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
      setProjectTitle('Pakistani Roman Urdu Demo');
      setCaptions(SAMPLE_ROMAN_URDU_CAPTIONS);
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

  // Load Project from Database
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

  // Delete Project from Database
  const handleDeleteProject = async (id) => {
    await deleteProjectFromDb(id);
    refreshProjectsList();
    if (projectId === id) {
      handleNewProject();
    }
  };

  // Start fresh project
  const handleNewProject = () => {
    setProjectId('proj_' + Date.now());
    setProjectTitle('');
    setFileName('');
    setFilePath('');
    setVideoSrc(null);
    setVideoFile(null);
    setCaptions([]);
    setStyle(CAPCUT_PRESETS[0].style);
    setPosition({ x: 50, y: 84 });
    setDuration(0);
    setCurrentTime(0);
  };

  // Playback control
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
  const handleUpdateCaption = (id, newText) => {
    setCaptions(prev => prev.map(c => {
      if (c.id === id) {
        const words = newText.split(/\s+/).filter(Boolean);
        const wordDur = words.length > 0 ? (c.end - c.start) / words.length : 0.5;
        const newWords = words.map((w, i) => ({
          word: w,
          start: Number((c.start + i * wordDur).toFixed(2)),
          end: Number((c.start + (i + 1) * wordDur).toFixed(2))
        }));
        return { ...c, text: newText, words: newWords };
      }
      return c;
    }));
  };

  const handleDeleteCaption = (id) => {
    setCaptions(prev => prev.filter(c => c.id !== id));
  };

  const handleAddCaptionAtCurrent = () => {
    const start = Number(currentTime.toFixed(2));
    const end = Number(Math.min(duration || 100, currentTime + 2.5).toFixed(2));
    const newId = Date.now();
    const newCap = {
      id: newId,
      start,
      end,
      text: "Naya Roman Urdu caption likhein",
      words: [
        { word: "Naya", start: start, end: start + 0.6 },
        { word: "Roman", start: start + 0.6, end: start + 1.2 },
        { word: "Urdu", start: start + 1.2, end: start + 1.8 },
        { word: "caption", start: start + 1.8, end: start + 2.5 }
      ]
    };

    setCaptions(prev => [...prev, newCap].sort((a, b) => a.start - b.start));
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

    setCaptions(prev => prev.flatMap(c => c.id === id ? [cap1, cap2] : [c]));
  };

  // Caption Generation Trigger
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

      setCaptions(generated);
      setIsGenerating(false);
      setGenerationProgress('');
      // Trigger instant save to local DB
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
      className="flex flex-col h-screen w-screen bg-[#07080b] text-zinc-100 overflow-hidden font-sans select-none"
    >
      {/* Hidden File Input for browser / fallback */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
        className="hidden"
      />

      {/* CapCut Top App Bar with Projects Database Button */}
      <Header
        fileName={fileName}
        aspectRatio={aspectRatioText}
        onOpenVideo={handleOpenVideo}
        onLoadDemo={handleLoadDemo}
        onOpenProjects={() => setIsProjectsOpen(true)}
        projectCount={projectsList.length}
        isSaved={isDbSaved}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onGenerateCaptions={handleGenerateCaptions}
        isGenerating={isGenerating}
        hasVideo={Boolean(videoSrc)}
        hasCaptions={captions.length > 0}
        apiKeySet={Boolean(settings.apiKey)}
      />

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Roman Urdu Captions Timeline List */}
        <SubtitleList
          captions={captions}
          activeCaptionId={activeCaption?.id}
          currentTime={currentTime}
          onUpdateCaption={handleUpdateCaption}
          onDeleteCaption={handleDeleteCaption}
          onAddCaption={handleAddCaptionAtCurrent}
          onSplitCaption={handleSplitCaption}
          onSeek={handleSeek}
          onGenerateCaptions={handleGenerateCaptions}
          isGenerating={isGenerating}
          generationProgress={generationProgress}
        />

        {/* Center: Video Viewport & On-Canvas Draggable Overlay */}
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

        {/* Right: CapCut Style, Fonts, Effects & Position Inspector */}
        <StyleStudio
          style={style}
          onUpdateStyle={(updated) => setStyle(prev => ({ ...prev, ...updated }))}
          position={position}
          onUpdatePosition={setPosition}
          displayMode={displayMode}
          onChangeDisplayMode={setDisplayMode}
        />
      </div>

      {/* Bottom CapCut Multi-Track Timeline */}
      <TimelineBar
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        captions={captions}
        activeCaptionId={activeCaption?.id}
        onAddCaptionAtPlayhead={handleAddCaptionAtCurrent}
      />

      {/* Local Database Projects & History Modal */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        projects={projectsList}
        activeProjectId={projectId}
        onLoadProject={handleLoadProject}
        onDeleteProject={handleDeleteProject}
        onNewProject={handleNewProject}
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
        fileName={fileName || 'video'}
        filePath={filePath}
      />
    </div>
  );
}
