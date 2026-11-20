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
  Flame,
  X
} from 'lucide-react';
import { CAPCUT_PRESETS, POSITION_PRESETS, FONT_OPTIONS } from '../utils/stylePresets';

export function StyleStudio({
  style,
  onUpdateStyle,
  position,
  onUpdatePosition,
  displayMode,
  onChangeDisplayMode,
  onClose
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
    <aside className="w-80 bg-white border-l border-zinc-200/90 flex flex-col h-full z-20 select-none shadow-lg">
      {/* Studio Header */}
      <div className="p-3 border-b border-zinc-200/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900">
          <Palette className="w-4 h-4 text-lime-600" />
          <span>Style Studio</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer"
            title="Close Style Studio"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Panel Tab Navigation */}
      <div className="flex border-b border-zinc-200 bg-zinc-50/70">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 flex flex-col items-center gap-1 text-[10px] font-semibold tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'text-zinc-950 border-b-2 border-lime-500 bg-white shadow-2xs font-bold'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-lime-600' : ''}`} />
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
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
              <Flame className="w-4 h-4 text-lime-600" />
              <span>16 Viral CapCut Presets</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              1-click styles matching popular TikTok, Shorts, and Reels aesthetics.
            </p>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {CAPCUT_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2.5 rounded-xl bg-white hover:bg-lime-50/40 border border-zinc-200 hover:border-lime-500 cursor-pointer transition-all group flex flex-col gap-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 group-hover:text-lime-700 transition-colors">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Apply</span>
                  </div>

                  {/* Preset Preview Box */}
                  <div className="h-9 rounded-lg bg-black flex items-center justify-center overflow-hidden border border-zinc-900">
                    <span
                      style={{
                        fontFamily: preset.style.fontFamily,
                        fontSize: '14px',
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
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Font Family
              </label>
              <select
                value={style.fontFamily}
                onChange={(e) => onUpdateStyle({ fontFamily: e.target.value })}
                className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-lime-500 shadow-2xs"
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
              <div className="flex justify-between text-xs font-medium text-zinc-700 mb-1">
                <span>Font Size</span>
                <span className="font-mono text-lime-700 font-bold">{style.fontSize}px</span>
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
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Capitalization
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'uppercase', label: 'ALL CAPS' },
                  { id: 'none', label: 'Normal' },
                  { id: 'capitalize', label: 'Title Case' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onUpdateStyle({ textTransform: item.id })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      style.textTransform === item.id
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Weight */}
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Font Weight
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['600', '800', '900'].map((w) => (
                  <button
                    key={w}
                    onClick={() => onUpdateStyle({ fontWeight: w })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      style.fontWeight === w
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    {w === '600' ? 'Bold' : w === '800' ? 'Extra' : 'Black (900)'}
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
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Text Fill Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={style.color}
                  onChange={(e) => onUpdateStyle({ color: e.target.value })}
                  className="w-8 h-8 rounded border border-zinc-200 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={style.color}
                  onChange={(e) => onUpdateStyle({ color: e.target.value })}
                  className="w-24 bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-mono text-zinc-800"
                />
                <div className="flex gap-1">
                  {['#FFE600', '#FFFFFF', '#00F2FE', '#FF2E93', '#22C55E'].map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdateStyle({ color: c })}
                      style={{ backgroundColor: c }}
                      className="w-5 h-5 rounded-full border border-zinc-300 hover:scale-110 transition-transform cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Stroke Width & Color */}
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-700 mb-1">
                <span>Outline Stroke</span>
                <span className="font-mono text-lime-700 font-bold">{style.strokeWidth}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={8}
                step={0.5}
                value={style.strokeWidth}
                onChange={(e) => onUpdateStyle({ strokeWidth: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Shadow Blur */}
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-700 mb-1">
                <span>Drop Shadow Blur</span>
                <span className="font-mono text-lime-700 font-bold">{style.shadowBlur}px</span>
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
          </div>
        )}

        {/* BOX TAB */}
        {activeTab === 'box' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-800">
                Background Badge Box
              </label>
              <input
                type="checkbox"
                checked={style.hasBackgroundBox}
                onChange={(e) => onUpdateStyle({ hasBackgroundBox: e.target.checked })}
                className="w-4 h-4 accent-[#84cc16]"
              />
            </div>

            {style.hasBackgroundBox && (
              <div className="space-y-3 pt-2 border-t border-zinc-100">
                <div>
                  <div className="flex justify-between text-xs text-zinc-600 mb-1">
                    <span>Opacity</span>
                    <span className="font-mono text-lime-700">{Math.round((style.boxOpacity || 0.8) * 100)}%</span>
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
                  <div className="flex justify-between text-xs text-zinc-600 mb-1">
                    <span>Corner Radius</span>
                    <span className="font-mono text-lime-700">{style.boxRadius || 8}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={24}
                    value={style.boxRadius || 8}
                    onChange={(e) => onUpdateStyle({ boxRadius: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* POSITION TAB */}
        {activeTab === 'position' && (
          <div className="space-y-4">
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Position Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {POSITION_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => handleSetPositionPreset(p)}
                  className="p-2 rounded-lg border border-zinc-200 hover:border-lime-500 bg-white hover:bg-lime-50/40 text-xs font-semibold text-zinc-800 transition-all cursor-pointer shadow-2xs"
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Display Mode (Karaoke vs Line) */}
            <div className="pt-3 border-t border-zinc-100">
              <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                Display Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onChangeDisplayMode?.('karaoke')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    displayMode === 'karaoke'
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-zinc-200'
                  }`}
                >
                  Karaoke Word Glow
                </button>
                <button
                  onClick={() => onChangeDisplayMode?.('line')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    displayMode === 'line'
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-zinc-200'
                  }`}
                >
                  Static Line
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
