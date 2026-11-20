# CapScribe Studio 🎬✨
### CapCut-Inspired Roman Urdu Video Caption Generator Desktop App

An ultra-sleek, premium Electron desktop application designed specifically for generating, editing, styling, and positioning **Roman Urdu captions** on videos. Built with inspiration from **CapCut's** renowned editing aesthetic and powered by Google Gemini AI.

---

## 🌟 Key Features

### 1. 🎙️ Roman Urdu Caption Generation
- Specifically tuned to understand Pakistani & South Asian Urdu speech and transcribe it verbatim into **Roman Urdu** (e.g., *"Assalam-o-Alaikum dosto"*, *"Aaj ki is video mein hum seekhenge"*, *"Bohot shukriya"*).
- Uses Google Gemini Flash (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-2.0-flash`) or Groq / OpenAI Whisper.
- High-precision sentence and **word-level timestamps** for animated karaoke highlight effects.
- Built-in **Try Demo** button to test with synthetic video and sample Pakistani Roman Urdu captions without any setup.

### 2. 🎯 Drag & Position Anywhere on Screen
- **Direct on-canvas dragging**: Click and drag the caption anywhere on the video preview (Top, Center, Lower-Third, Bottom, or custom X/Y coordinates).
- Visual drag handles and real-time bounding box indicators.
- Quick position presets (15%, 28%, 50%, 72%, 85%) and manual X & Y sliders.
- Social media safe zone guidelines overlay (for TikTok / Instagram Reels safe boundaries).

### 3. 🎨 CapCut Pro Styling Studio
- **8 1-Click Viral Presets**:
  - **CapCut Viral Yellow**: Bold yellow, thick black outline, drop shadow
  - **TikTok Bold White**: High-contrast white with crisp stroke
  - **Cyberpunk Neon**: Electric cyan glow
  - **CapCut Dark Pill**: Frosted translucent dark pill box
  - **Hormozi Kinetic**: Punchy bold uppercase with animated word highlight
  - **Barbie Neon Pink**: Vibrant hot pink with white stroke
  - **Royal Gold**: Opulent gold with ambient glow
  - **Cinema Clean**: Minimalist clean subtitles for podcasts/vlogs
- Custom typography: Montserrat, Poppins, Bangers/Impact, Syne, Inter.
- Stroke width & color, shadow blur, background box opacity, corner radius.
- **Active Word Karaoke Highlight**: Highlights words in real-time as they are spoken.

### 4. 📝 Roman Urdu Captions Timeline Editor
- Left-hand inspector with list of all captions.
- Edit any Roman Urdu word directly to tweak spelling or slang.
- Timecode badges (click to jump the video directly to that moment).
- Add new captions, delete, or split long captions into two.

### 5. 💾 Flexible Export Options
- **Burn-in Captions into Video**: Directly renders and burns styled captions onto video frames and exports MP4/WebM.
- **Export .SRT**: Standard SubRip subtitles for YouTube, Premiere Pro, CapCut, DaVinci Resolve.
- **Export .VTT**: WebVTT subtitles for web video players.
- **Export .JSON**: Complete project file preserving all timestamps, styling, and positions.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm

### Launch the App

To run in **Development Mode** (with live hot-reloading):
```bash
npm run dev
```

To run the **Desktop App** using the production build:
```bash
npm run build
npm start
```

---

## 🔑 Setting Up Gemini API Key (Free)
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. In the app, click **Settings** (top right).
3. Paste your Gemini API key and click **Save Settings**.
4. Upload any video and click **Generate Captions**!

---

## 🛠️ Project Structure

```
caption-generator/
├── electron/
│   ├── main.cjs            # Electron main process & native dialog IPC
│   └── preload.cjs         # Context bridge exposing safe desktop APIs
├── src/
│   ├── index.html          # HTML entry point with Google Fonts
│   ├── index.css           # CapCut dark theme styling & custom scrollbars
│   ├── main.jsx            # React root mount
│   ├── App.jsx             # Main orchestrator & state manager
│   ├── components/
│   │   ├── Header.jsx          # Top navigation bar & window controls
│   │   ├── VideoPlayer.jsx     # Central stage, playback & safe zones
│   │   ├── DraggableCaption.jsx# Interactive on-canvas draggable caption box
│   │   ├── SubtitleList.jsx    # Left panel for editing Roman Urdu captions
│   │   ├── StyleStudio.jsx     # Right panel with CapCut style controls
│   │   ├── SettingsModal.jsx   # Gemini / Whisper API configuration
│   │   └── ExportModal.jsx     # Video burning & subtitle export modal
│   └── utils/
│       ├── audioExtractor.js   # Fast in-browser 16kHz audio extraction
│       ├── geminiTranscriber.js# Roman Urdu transcription engine
│       ├── srtExporter.js      # SRT/VTT/JSON & canvas video burn-in engine
│       ├── sampleData.js       # Authentic Pakistani Roman Urdu demo
│       └── stylePresets.js     # CapCut typography presets
├── package.json
└── vite.config.mjs
```
