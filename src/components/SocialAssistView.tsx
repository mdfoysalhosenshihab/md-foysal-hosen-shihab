import React, { useState } from 'react';
import { 
  Send, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Share2, 
  MessageSquare, 
  Languages, 
  User, 
  Phone, 
  Bookmark,
  CheckCircle2,
  Reply,
  Link as LinkIcon,
  Zap,
  ArrowRight,
  Clock,
  ThumbsUp,
  XCircle,
  HelpCircle,
  Calendar
} from 'lucide-react';
import { SocialDraft } from '../types';
import { soundEffects } from '../services/audioService';

interface SocialAssistViewProps {
  onAskAiToDraft: (prompt: string) => Promise<void>;
  savedDrafts: SocialDraft[];
  onSaveDraft: (draft: SocialDraft) => void;
  onDeleteDraft: (id: string) => void;
}

export const SocialAssistView: React.FC<SocialAssistViewProps> = ({
  onAskAiToDraft,
  savedDrafts,
  onSaveDraft,
  onDeleteDraft,
}) => {
  const [mode, setMode] = useState<'reply' | 'compose'>('reply');
  const [platform, setPlatform] = useState<'whatsapp' | 'messenger'>('whatsapp');
  const [recipient, setRecipient] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [incomingMessage, setIncomingMessage] = useState('');
  const [messageText, setMessageText] = useState('');
  const [tone, setTone] = useState<string>('polite');
  const [language, setLanguage] = useState<'bangla' | 'english'>('bangla');
  const [promptTopic, setPromptTopic] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Quick Reply Presets
  const replyPresets = [
    {
      id: 'accept',
      labelBn: 'রাজি / গ্রহণ করছি',
      labelEn: 'Accept / Confirm',
      icon: ThumbsUp,
      prompt: 'Accept enthusiastically and confirm availability.',
    },
    {
      id: 'delay',
      labelBn: 'একটু পরে জানাচ্ছি',
      labelEn: 'Need 15 Mins / In a Meeting',
      icon: Clock,
      prompt: 'Politely inform that I am currently tied up in a meeting and will get back shortly within 30 minutes.',
    },
    {
      id: 'decline',
      labelBn: 'বিনয়ের সাথে অপারগতা',
      labelEn: 'Polite Decline',
      icon: XCircle,
      prompt: 'Politely and respectfully decline the request due to prior scheduling commitments, offering gratitude.',
    },
    {
      id: 'details',
      labelBn: 'বিস্তারিত জানতে চাই',
      labelEn: 'Ask for Details',
      icon: HelpCircle,
      prompt: 'Acknowledge receipt and request more technical or contextual details before proceeding.',
    },
    {
      id: 'meeting',
      labelBn: 'মিটিং শিডিউল কনফার্ম',
      labelEn: 'Schedule Call',
      icon: Calendar,
      prompt: 'Confirm meeting time or suggest 3:00 PM / 4:00 PM today via Google Meet.',
    },
    {
      id: 'formal_ack',
      labelBn: 'অফিসিয়াল প্রাপ্তি স্বীকার',
      labelEn: 'Official Acknowledgment',
      icon: CheckCircle2,
      prompt: 'Formal business acknowledgment confirming receipt and informing that it is under review.',
    },
  ];

  // Helper to format clean phone number
  const cleanPhone = contactInfo.replace(/[^0-9+]/g, '');
  const encodedMessage = encodeURIComponent(messageText);
  
  // Real auto-linked WhatsApp URLs
  const whatsappWebUrl = cleanPhone 
    ? `https://web.whatsapp.com/send?phone=${cleanPhone.replace('+', '')}&text=${encodedMessage}`
    : `https://web.whatsapp.com/send?text=${encodedMessage}`;
    
  const whatsappDirectAppUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  const messengerUrl = contactInfo.trim()
    ? `https://m.me/${contactInfo.trim().replace(/^@/, '')}`
    : `https://www.messenger.com`;

  const activeLink = platform === 'whatsapp' ? whatsappWebUrl : messengerUrl;

  const handleCopyMessage = () => {
    if (!messageText.trim()) return;
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    soundEffects.playSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeLink);
    setCopiedLink(true);
    soundEffects.playSuccess();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Instant Auto-Copy and Open WhatsApp Web
  const handleAutoLinkAndSend = () => {
    if (!messageText.trim()) {
      alert('Please type or generate a message first.');
      return;
    }
    navigator.clipboard.writeText(messageText);
    soundEffects.playSuccess();
    window.open(activeLink, '_blank', 'noopener,noreferrer');
  };

  const handleGenerateReply = async (presetPrompt?: string) => {
    setIsGenerating(true);
    const intent = presetPrompt || promptTopic || 'Polite, helpful contextual response.';
    const original = incomingMessage.trim() ? `Incoming message: "${incomingMessage}".` : '';
    const instruction = `Draft an auto-linked ${platform === 'whatsapp' ? 'WhatsApp' : 'Messenger'} reply to ${recipient || 'the sender'}. ${original} Reply intent: ${intent}. Language: ${language === 'bangla' ? 'Bengali (বাংলা)' : 'English'}. Keep it concise, natural, and courteous.`;
    
    await onAskAiToDraft(instruction);
    setIsGenerating(false);
  };

  const handleSaveToDrafts = () => {
    if (!messageText.trim()) return;
    const newDraft: SocialDraft = {
      id: `draft-${Date.now()}`,
      platform,
      recipient: recipient.trim() || 'WhatsApp Contact',
      contactInfo: contactInfo.trim(),
      message: messageText.trim(),
      tone,
      language,
      isReply: mode === 'reply',
      replyToSnippet: incomingMessage.slice(0, 80),
      autoLinkUrl: activeLink,
      timestamp: new Date().toISOString(),
    };
    onSaveDraft(newDraft);
    soundEffects.playSuccess();
    alert('Draft & Auto-Link saved to Shihab AI memory!');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-y-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Share2 className="w-6 h-6 text-emerald-400" />
              WhatsApp Auto-Link & Smart Reply Studio
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Auto-generate direct WhatsApp links and compose intelligent bilingual replies in 1 click.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setMode('reply')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                mode === 'reply'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Reply className="w-3.5 h-3.5" />
              <span>Smart Auto-Reply</span>
            </button>
            <button
              onClick={() => setMode('compose')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                mode === 'compose'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>New Composer</span>
            </button>
          </div>
        </div>

        {/* Live Auto-Link Quick Bar */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-emerald-700/60 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-900/60 text-emerald-400 border border-emerald-700/80 shrink-0">
              <LinkIcon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">WhatsApp Auto-Link Engine</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate max-w-xl mt-0.5">
                {activeLink}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Auto-Link'}</span>
            </button>

            <button
              onClick={handleAutoLinkAndSend}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Launch & Send in WhatsApp Web</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Controls (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Contact Details Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  Target Recipient & Phone Number
                </h3>

                {/* Language Switch */}
                <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs">
                  <button
                    onClick={() => setLanguage('bangla')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${
                      language === 'bangla' ? 'bg-emerald-700 text-white font-bengali' : 'text-slate-400'
                    }`}
                  >
                    বাংলা
                  </button>
                  <button
                    onClick={() => setLanguage('english')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${
                      language === 'english' ? 'bg-emerald-700 text-white' : 'text-slate-400'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Recipient Name / Contact
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="e.g. Tanvir, Client, Manager"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    WhatsApp Phone Number (with Country Code)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder="e.g. +8801712345678 or 01712345678"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* In Reply Mode: Incoming Message box */}
              {mode === 'reply' && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <label className="block text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Reply className="w-3.5 h-3.5 text-cyan-400" />
                      Incoming WhatsApp Message to Answer
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Paste from WhatsApp chat
                    </span>
                  </label>
                  <textarea
                    value={incomingMessage}
                    onChange={(e) => setIncomingMessage(e.target.value)}
                    rows={2}
                    placeholder="e.g. 'ভাইয়া, কালকের প্রেজেন্টেশন কি রেডি আছে? মিটিং কখন হবে?' or 'Can you deliver the final files today?'"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
                  />

                  {/* 1-Click Quick Reply Chips */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 font-medium">Quick Reply Intents:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {replyPresets.map((preset) => {
                        const Icon = preset.icon;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleGenerateReply(preset.prompt)}
                            disabled={isGenerating}
                            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800/90 hover:border-emerald-700/80 text-left transition-all group flex items-center space-x-2"
                          >
                            <div className="p-1.5 rounded-lg bg-slate-900 group-hover:bg-emerald-950 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold text-slate-200 group-hover:text-emerald-300 truncate font-bengali">
                                {language === 'bangla' ? preset.labelBn : preset.labelEn}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Reply / Message Body */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  {mode === 'reply' ? 'Drafted WhatsApp Reply' : 'Message Content'}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {messageText.length} chars
                </span>
              </div>

              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={5}
                placeholder="The drafted message appears here. You can also edit freely or ask Shihab AI..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
              />

              {/* Direct Action Bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleAutoLinkAndSend}
                  disabled={!messageText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Send via WhatsApp Web</span>
                </button>

                <a
                  href={whatsappDirectAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open via wa.me App</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-2 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToDrafts}
                  disabled={!messageText.trim()}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 transition-colors"
                  title="Save draft"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: AI Custom Instructions & Saved Drafts */}
          <div className="space-y-5">
            {/* Custom Prompt Box */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Custom AI Reply Prompt
              </h3>
              <p className="text-xs text-slate-400">
                Tell Shihab AI exactly how you want to respond:
              </p>

              <div className="space-y-2">
                <textarea
                  value={promptTopic}
                  onChange={(e) => setPromptTopic(e.target.value)}
                  rows={3}
                  placeholder="e.g. 'Politely ask for 2 days extension due to personal emergency', or 'Confirm we received payment and are dispatching today'..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />

                <button
                  type="button"
                  onClick={() => handleGenerateReply()}
                  disabled={isGenerating || !promptTopic.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'Generating Reply...' : 'Generate Auto-Linked Reply'}</span>
                </button>
              </div>
            </div>

            {/* Auto-Linked Saved History */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-400" />
                Saved Auto-Linked Drafts ({savedDrafts.length})
              </h3>

              {savedDrafts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No saved drafts yet. Drafts and their auto-links will be stored here.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {savedDrafts.slice(0, 6).map((d) => (
                    <div
                      key={d.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-300 truncate max-w-[150px]">
                          {d.recipient}
                        </span>
                        {d.isReply && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                            REPLY
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] line-clamp-2">
                        {d.message}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {d.contactInfo || 'No phone'}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setMessageText(d.message);
                              setRecipient(d.recipient);
                              setContactInfo(d.contactInfo);
                              soundEffects.playSuccess();
                            }}
                            className="text-cyan-400 hover:underline text-[11px]"
                          >
                            Load
                          </button>
                          {d.autoLinkUrl && (
                            <a
                              href={d.autoLinkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:underline text-[11px] flex items-center gap-0.5"
                            >
                              <span>Send</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
