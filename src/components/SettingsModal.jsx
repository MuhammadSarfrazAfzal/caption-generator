import React, { useState } from 'react';
import { X, Key, Sparkles, Check, ExternalLink, HelpCircle, ShieldCheck } from 'lucide-react';

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) {
  const [apiKey, setApiKey] = useState(settings.apiKey || 'AIzaSyCDSZ60J2PVaivfcpyUf7LHdQ7R_LOcL4w');
  const [provider, setProvider] = useState(settings.provider || 'gemini');
  const [model, setModel] = useState(settings.model || 'gemini-2.5-flash');
  const [customPrompt, setCustomPrompt] = useState(settings.customPrompt || '');
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    if (settings.apiKey) {
      setApiKey(settings.apiKey);
    }
  }, [settings.apiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      apiKey: apiKey.trim(),
      provider,
      model,
      customPrompt: customPrompt.trim()
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="glass-modal w-full max-w-lg rounded-2xl border border-[#2d3244] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222634] flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-zinc-100">
              Transcription & AI Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#1f2230] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Provider Selector */}
          <div>
            <label className="font-semibold text-zinc-300 block mb-1.5">
              AI Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`py-2 px-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                  provider === 'gemini'
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200'
                    : 'bg-[#151722] border-[#252838] text-zinc-400'
                }`}
              >
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Google Gemini (Recommended)
                </span>
                <span className="text-[10px] text-zinc-400">
                  Best for Pakistani Roman Urdu speech & free tier
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('groq')}
                className={`py-2 px-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                  provider === 'groq'
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200'
                    : 'bg-[#151722] border-[#252838] text-zinc-400'
                }`}
              >
                <span className="font-bold text-xs">Groq / OpenAI Whisper</span>
                <span className="text-[10px] text-zinc-400">
                  Alternative Whisper speech engine
                </span>
              </button>
            </div>
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <span>{provider === 'gemini' ? 'Google AI Gemini API Key' : 'API Key'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </label>
              {provider === 'gemini' && (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline underline-offset-2"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <input
              type="password"
              placeholder={provider === 'gemini' ? 'AIzaSy...' : 'gsk_... or sk-...'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-[#11131a] border border-[#272b3c] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Your API key is saved locally in your desktop storage and never shared.
            </p>
          </div>

          {/* Model selection if Gemini */}
          {provider === 'gemini' && (
            <div>
              <label className="font-semibold text-zinc-300 block mb-1">
                Gemini Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#11131a] border border-[#272b3c] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Fast & Accurate)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Reliable & High Quota)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </select>
            </div>
          )}

          {/* Custom Instruction Prompt */}
          <div>
            <label className="font-semibold text-zinc-300 block mb-1">
              Custom Roman Urdu Prompt / Vocabulary Hints (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Focus on Pakistani colloquial Roman Urdu, brand names, slang..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-[#11131a] border border-[#272b3c] rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#12141c] border-t border-[#222634] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#1a1d28] hover:bg-[#232736] text-zinc-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{isSaved ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
