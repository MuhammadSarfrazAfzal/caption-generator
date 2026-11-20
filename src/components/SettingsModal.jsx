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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 select-none">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-zinc-200/90 overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-zinc-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-lime-100/80 border border-lime-300 flex items-center justify-center text-lime-800">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 tracking-tight">
                AI Transcription & Engine Settings
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium">
                Configure your Gemini API key and speech-to-text models
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4.5 text-xs">
          {/* Provider Selector */}
          <div>
            <label className="font-bold text-zinc-800 block mb-2">
              Speech Recognition Engine
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  provider === 'gemini'
                    ? 'bg-lime-50/70 border-lime-500 text-zinc-950 shadow-2xs ring-1 ring-lime-400/30 font-semibold'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100/60'
                }`}
              >
                <span className="font-bold text-xs flex items-center gap-1.5 text-zinc-950">
                  <Sparkles className="w-3.5 h-3.5 text-lime-700" />
                  Google Gemini (Recommended)
                </span>
                <span className="text-[11px] text-zinc-500 font-normal leading-relaxed">
                  Fastest & best for Pakistani Roman Urdu speech nuances
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('groq')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  provider === 'groq'
                    ? 'bg-lime-50/70 border-lime-500 text-zinc-950 shadow-2xs ring-1 ring-lime-400/30 font-semibold'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100/60'
                }`}
              >
                <span className="font-bold text-xs text-zinc-950">Groq / OpenAI Whisper</span>
                <span className="text-[11px] text-zinc-500 font-normal leading-relaxed">
                  Alternative Whisper speech engine
                </span>
              </button>
            </div>
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-zinc-800 flex items-center gap-1.5">
                <span>{provider === 'gemini' ? 'Google AI Gemini API Key' : 'API Key'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </label>
              {provider === 'gemini' && (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-lime-700 hover:text-lime-800 font-bold flex items-center gap-1 underline underline-offset-2"
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
              className="w-full bg-zinc-50 border border-zinc-200 focus:border-lime-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-900 placeholder-zinc-400 focus:outline-none transition-colors shadow-2xs"
            />
            <p className="text-[10px] text-zinc-400 mt-1.5">
              Your API key is saved locally on your desktop machine and never shared externally.
            </p>
          </div>

          {/* Model selection if Gemini */}
          {provider === 'gemini' && (
            <div>
              <label className="font-bold text-zinc-800 block mb-1.5">
                Gemini Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-lime-500 focus:bg-white transition-colors shadow-2xs"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Fast & Accurate - Recommended)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (High Quota)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </select>
            </div>
          )}

          {/* Custom Instruction Prompt */}
          <div>
            <label className="font-bold text-zinc-800 block mb-1.5">
              Custom Roman Urdu Prompt / Vocabulary Hints (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Focus on Pakistani colloquial Roman Urdu, brand names, slang..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 placeholder-zinc-400 resize-none focus:outline-none focus:border-lime-500 focus:bg-white transition-colors shadow-2xs"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50/70 border-t border-zinc-100 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-2xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#bbf421] hover:bg-[#a3e635] text-zinc-950 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" /> : null}
            <span>{isSaved ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
