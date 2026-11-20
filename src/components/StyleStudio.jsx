import React, { useState } from 'react';
import { 
  Palette, 
  Type, 
  Sparkles, 
  Layout, 
  Square, 
  Check, 
  RotateCcw,
  Sliders,
  Flame
} from 'lucide-react';
import { CAPCUT_PRESETS, POSITION_PRESETS, FONT_OPTIONS } from '../utils/stylePresets';

export function StyleStudio({
  style,
  onUpdateStyle,
  position,
  onUpdatePosition,
  displayMode,
  onChangeDisplayMode
}) {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'font' | 'effects' | 'box' | 'position'

  const handleApplyPreset = (preset) => {
    onUpdateStyle(preset.style);
  };

  const handleSetPositionPreset = (posPreset) => {
    onUpdatePosition({ x: posPreset.x, y: posPreset.y });
  };

  const tabs = [
    { id: 'presets', label: 'Presets', icon: Sparkles },
    { id: 'font', label: 'Text', icon: Type },
    { id: 'effects', label: 'Effects', icon: Palette },
    { id: 'box', label: 'Box', icon: Square },
    { id: 'position', label: 'Position', icon: Layout },
  ];

  return (
    <aside className="w-84 bg-[#101218] border-l border-[#1f2230] flex flex-col h-full z-10 select-none">
      {/* Panel Tab Navigation */}
      <div className="flex border-b border-[#1f2230] bg-[#12141c]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] font-semibold tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-950/20'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* PRESETS TAB */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>CapCut Viral Presets</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Instant 1-click styling matching popular TikTok and Instagram Reels formats.
            </p>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              {CAPCUT_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-3 rounded-xl bg-[#151722] hover:bg-[#1a1d2c] border border-[#232636] hover:border-cyan-500/50 cursor-pointer transition-all group flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 group-hover:text-cyan-300 transition-colors">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">Select</span>
                  </div>

                  {/* Preset Preview Box */}
                  <div className="h-10 rounded-lg bg-black/60 flex items-center justify-center overflow-hidden border border-[#252838]">
                    <span
                      style={{
                        fontFamily: preset.style.fontFamily,
                        fontSize: '15px',
                        fontWeight: preset.style.fontWeight,
                        color: preset.style.color,
                        textTransform: preset.style.textTransform,
                        letterSpacing: preset.style.letterSpacing,
                        WebkitTextStroke: preset.style.strokeWidth ? `${preset.style.strokeWidth * 0.4}px ${preset.style.strokeColor}` : 'none',
                        textShadow: preset.style.shadowBlur ? `0 2px 4px ${preset.style.shadowColor}` : 'none',
                        backgroundColor: preset.style.hasBackgroundBox ? preset.style.boxColor : 'transparent',
                        padding: preset.style.hasBackgroundBox ? '2px 8px' : '0',
                        borderRadius: preset.style.hasBackgroundBox ? '4px' : '0',
                      }}
                    >
                      {preset.previewText}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FONT & TYPOGRAPHY TAB */}
        {activeTab === 'font' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Font Family
              </label>
              <select
                value={style.fontFamily}
                onChange={(e) => onUpdateStyle({ fontFamily: e.target.value })}
                className="w-full bg-[#151722] border border-[#262a3a] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                <span>Font Size</span>
                <span className="font-mono text-cyan-400">{style.fontSize}px</span>
              </div>
              <input
                type="range"
                min={16}
                max={72}
                value={style.fontSize}
                onChange={(e) => onUpdateStyle({ fontSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Text Transform */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Capitalization
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'uppercase', label: 'ALL CAPS' },
                  { id: 'none', label: 'As Spoken' },
                  { id: 'capitalize', label: 'Title Case' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onUpdateStyle({ textTransform: item.id })}
                    className={`py-1.5 px-2 rounded text-[11px] font-semibold border transition-all ${
                      style.textTransform === item.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-[#151722] text-zinc-400 border-[#242838]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Weight */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Weight
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['600', '800', '900'].map((w) => (
                  <button
                    key={w}
                    onClick={() => onUpdateStyle({ fontWeight: w })}
                    className={`py-1.5 px-2 rounded text-[11px] font-semibold border transition-all ${
                      style.fontWeight === w
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-[#151722] text-zinc-400 border-[#242838]'
                    }`}
                  >
                    {w === '600' ? 'Bold' : w === '800' ? 'Extra Bold' : 'Black (900)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EFFECTS & STROKE TAB */}
        {activeTab === 'effects' && (
          <div className="space-y-4">
            {/* Text Color */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Text Fill Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={style.color}
                  onChange={(e) => onUpdateStyle({ color: e.target.value })}
                  className="w-8 h-8 rounded border border-[#2b3042] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={style.color}
                  onChange={(e) => onUpdateStyle({ color: e.target.value })}
                  className="w-24 bg-[#151722] border border-[#262a3a] rounded px-2 py-1 text-xs font-mono text-zinc-200"
                />
                <div className="flex gap-1">
                  {['#FFE600', '#FFFFFF', '#00F2FE', '#FF2E93', '#22C55E'].map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdateStyle({ color: c })}
                      style={{ backgroundColor: c }}
                      className="w-5 h-5 rounded-full border border-black/40 hover:scale-110 transition-transform"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Stroke Width & Color */}
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                <span>Outline Stroke</span>
                <span className="font-mono text-cyan-400">{style.strokeWidth}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={8}
                step={0.5}
                value={style.strokeWidth}
                onChange={(e) => onUpdateStyle({ strokeWidth: parseFloat(e.target.value) })}
                className="w-full mb-2"
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={style.strokeColor}
                  onChange={(e) => onUpdateStyle({ strokeColor: e.target.value })}
                  className="w-7 h-7 rounded border border-[#2b3042] bg-transparent cursor-pointer"
                />
                <span className="text-xs text-zinc-400">Stroke Color: {style.strokeColor}</span>
              </div>
            </div>

            {/* Drop Shadow Blur */}
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                <span>Shadow Blur</span>
                <span className="font-mono text-cyan-400">{style.shadowBlur}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={25}
                value={style.shadowBlur}
                onChange={(e) => onUpdateStyle({ shadowBlur: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Display & Karaoke Mode */}
            <div className="pt-2 border-t border-[#1f2230]">
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Karaoke Animation
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => onChangeDisplayMode('line')}
                  className={`py-1.5 px-2 rounded text-xs font-medium border transition-all ${
                    displayMode === 'line'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-[#151722] text-zinc-400 border-[#242838]'
                  }`}
                >
                  Standard Line
                </button>
                <button
                  onClick={() => onChangeDisplayMode('karaoke')}
                  className={`py-1.5 px-2 rounded text-xs font-medium border transition-all ${
                    displayMode === 'karaoke'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-[#151722] text-zinc-400 border-[#242838]'
                  }`}
                >
                  Active Word Highlight
                </button>
              </div>

              {displayMode === 'karaoke' && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={style.highlightColor}
                    onChange={(e) => onUpdateStyle({ highlightColor: e.target.value })}
                    className="w-7 h-7 rounded border border-[#2b3042] bg-transparent cursor-pointer"
                  />
                  <span className="text-xs text-zinc-300">Karaoke Word Color</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BACKGROUND BOX & SIZING TAB */}
        {activeTab === 'box' && (
          <div className="space-y-4">
            {/* Box Dimensions & Custom Width Section */}
            <div className="space-y-3 pb-3 border-b border-[#1f2230]">
              <label className="text-xs font-bold text-zinc-200 block">
                Caption Box Width
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateStyle({ boxWidth: 0 })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    !style.boxWidth
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-[#151722] text-zinc-400 border-[#242838] hover:text-zinc-200'
                  }`}
                >
                  Auto Fit (Text)
                </button>
                <button
                  onClick={() => onUpdateStyle({ boxWidth: style.boxWidth || 320 })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    style.boxWidth
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-[#151722] text-zinc-400 border-[#242838] hover:text-zinc-200'
                  }`}
                >
                  Custom Width
                </button>
              </div>

              {style.boxWidth > 0 && (
                <div>
                  <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                    <span>Width Slider</span>
                    <span className="font-mono text-cyan-400">{style.boxWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min={120}
                    max={750}
                    step={10}
                    value={style.boxWidth}
                    onChange={(e) => onUpdateStyle({ boxWidth: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
                    <span>120px (Narrow)</span>
                    <span>750px (Wide)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Padding Controls */}
            <div className="space-y-3 pb-3 border-b border-[#1f2230]">
              <label className="text-xs font-bold text-zinc-200 block">
                Box Padding & Spacing
              </label>

              <div>
                <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                  <span>Horizontal Padding</span>
                  <span className="font-mono text-cyan-400">{style.boxPaddingX ?? 18}px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={60}
                  value={style.boxPaddingX ?? 18}
                  onChange={(e) => onUpdateStyle({ boxPaddingX: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                  <span>Vertical Padding</span>
                  <span className="font-mono text-cyan-400">{style.boxPaddingY ?? 8}px</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={40}
                  value={style.boxPaddingY ?? 8}
                  onChange={(e) => onUpdateStyle({ boxPaddingY: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Background Color & Opacity Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#151722] border border-[#242838]">
              <span className="text-xs font-semibold text-zinc-200">Show Background Color Box</span>
              <input
                type="checkbox"
                checked={style.hasBackgroundBox}
                onChange={(e) => onUpdateStyle({ hasBackgroundBox: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            {style.hasBackgroundBox && (
              <>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Box Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={style.boxColor}
                      onChange={(e) => onUpdateStyle({ boxColor: e.target.value })}
                      className="w-8 h-8 rounded border border-[#2b3042] bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-zinc-300">{style.boxColor}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                    <span>Opacity</span>
                    <span className="font-mono text-cyan-400">{Math.round((style.boxOpacity || 0.8) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={style.boxOpacity ?? 0.8}
                    onChange={(e) => onUpdateStyle({ boxOpacity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                    <span>Corner Radius</span>
                    <span className="font-mono text-cyan-400">{style.boxRadius || 8}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={36}
                    value={style.boxRadius || 8}
                    onChange={(e) => onUpdateStyle({ boxRadius: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* POSITION TAB */}
        {activeTab === 'position' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-2">
                Quick Position Presets
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {POSITION_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSetPositionPreset(p)}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#151722] hover:bg-[#1c202e] border border-[#242838] hover:border-cyan-500/40 text-xs font-medium text-zinc-300 hover:text-cyan-300 transition-all text-left"
                  >
                    <span>{p.name}</span>
                    <span className="font-mono text-[10px] text-zinc-500">Y: {p.y}%</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#1f2230] space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                  <span>Horizontal (X)</span>
                  <span className="font-mono text-cyan-400">{position.x}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={position.x}
                  onChange={(e) => onUpdatePosition({ x: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
                  <span>Vertical (Y)</span>
                  <span className="font-mono text-cyan-400">{position.y}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={position.y}
                  onChange={(e) => onUpdatePosition({ y: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <button
                onClick={() => onUpdatePosition({ x: 50, y: 85 })}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#181b26] hover:bg-[#202434] text-zinc-300 text-xs font-medium border border-[#272b3b] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Bottom Center</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// Font styling controls
// Stroke and glow settings
