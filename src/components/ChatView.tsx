import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Bot, 
  User, 
  Sparkles, 
  Clock, 
  Bell, 
  Calendar, 
  Monitor, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Play, 
  ShieldAlert,
  Loader2,
  Trash2,
  Share2
} from 'lucide-react';
import { Message, FunctionCallItem, PCAgentStatus } from '../types';
import { ttsService, initSpeechRecognition, soundEffects } from '../services/audioService';

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (text: string) => Promise<void>;
  isThinking: boolean;
  onClearHistory: () => void;
  agentStatus: PCAgentStatus;
  onExecuteFunctionCall: (call: FunctionCallItem, messageId: string) => Promise<void>;
  onRejectFunctionCall: (call: FunctionCallItem, messageId: string) => void;
  voiceLanguage: 'bn-BD' | 'en-US';
  onChangeVoiceLanguage: (lang: 'bn-BD' | 'en-US') => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isThinking,
  onClearHistory,
  agentStatus,
  onExecuteFunctionCall,
  onRejectFunctionCall,
  voiceLanguage,
  onChangeVoiceLanguage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSpeechMsgId, setActiveSpeechMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Speech Recognition setup
  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const controller = initSpeechRecognition(
      voiceLanguage,
      (transcript) => {
        setInputText(transcript);
      },
      (error) => {
        console.warn('Speech error:', error);
        setIsListening(false);
      },
      (listening) => {
        setIsListening(listening);
      }
    );

    if (controller.isSupported) {
      recognitionRef.current = controller;
      controller.start();
    } else {
      alert('Speech Recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isThinking) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setInputText('');
    await onSendMessage(trimmed);
  };

  const handleSpeak = (text: string, msgId: string, lang?: 'bn' | 'en') => {
    if (activeSpeechMsgId === msgId) {
      ttsService.stop();
      setActiveSpeechMsgId(null);
    } else {
      setActiveSpeechMsgId(msgId);
      ttsService.speak(text, lang || 'en');
      const checkInterval = setInterval(() => {
        if (!ttsService.isSpeaking()) {
          setActiveSpeechMsgId(null);
          clearInterval(checkInterval);
        }
      }, 500);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    { text: "Auto link WhatsApp reply to: 'Can we schedule a call at 3 PM?'", lang: 'en', desc: 'Auto Link Reply' },
    { text: "হোয়াটসঅ্যাপে উত্তর ড্রাফট করো: 'কাজের আপডেট কেমন?'", lang: 'bn', desc: 'WhatsApp Auto-Reply' },
    { text: 'সকাল ৭টায় একটি এলার্ম দাও', lang: 'bn', desc: 'Set 7:00 AM Alarm' },
    { text: 'আজ দুপুর ২টায় মিটিংয়ের রিমাইন্ডার দাও', lang: 'bn', desc: 'Meeting Reminder' },
    { text: 'Open Notepad on my Windows PC', lang: 'en', desc: 'Launch Notepad' },
    { text: 'Lock my workstation PC', lang: 'en', desc: 'Lock Screen' },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950 relative overflow-hidden">
      {/* Background ambient glowing effect */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top chat bar */}
      <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">Shihab AI Desktop Console</span>
          <span className="text-xs text-slate-500 font-mono">• Gemini 3.8 Flash Function Calling</span>
        </div>

        <div className="flex items-center space-x-2">
          {messages.length > 1 && (
            <button
              onClick={onClearHistory}
              className="text-xs text-slate-400 hover:text-rose-400 px-2.5 py-1 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 flex items-center gap-1.5 transition-colors"
              title="Clear conversation history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-4xl mx-auto`}
            >
              <div className="flex items-start gap-3 w-full max-w-3xl">
                {!isUser && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-cyan-600/20 text-white mt-1">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
                  {/* Sender & timestamp */}
                  <div className="flex items-center gap-2 mb-1 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {isUser ? 'You' : 'Shihab AI'}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.language && (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {message.language === 'bn' ? 'বাংলা' : 'English'}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none backdrop-blur-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">
                      {message.text}
                    </div>

                    {/* Speech TTS playback button for Shihab AI messages */}
                    {!isUser && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <button
                          onClick={() => handleSpeak(message.text, message.id, message.language)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                            activeSpeechMsgId === message.id
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                          title="Read message aloud"
                        >
                          {activeSpeechMsgId === message.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="text-[11px] font-medium animate-pulse">Reading aloud...</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Speak</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => copyToClipboard(message.text, message.id)}
                          className="hover:text-slate-200 flex items-center gap-1 text-[11px]"
                          title="Copy message"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Function Calls Resolution Cards */}
                  {message.functionCalls && message.functionCalls.length > 0 && (
                    <div className="mt-3 space-y-2.5 w-full">
                      {message.functionCalls.map((call, idx) => (
                        <FunctionCallCard
                          key={call.id || idx}
                          call={call}
                          messageId={message.id}
                          agentStatus={agentStatus}
                          onExecute={() => onExecuteFunctionCall(call, message.id)}
                          onReject={() => onRejectFunctionCall(call, message.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 mt-1">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex items-start gap-3 max-w-3xl mx-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-cyan-600/20 text-white animate-pulse">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center space-x-3 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Shihab AI is reasoning and preparing tools...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar (when only welcome message or few messages) */}
      {messages.length <= 2 && (
        <div className="px-6 py-2 bg-slate-950/80 border-t border-slate-900 overflow-x-auto scrollbar-none flex items-center gap-2 max-w-4xl mx-auto w-full">
          <span className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Try commands:
          </span>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => onSendMessage(p.text)}
              className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-xs text-slate-300 hover:text-white border border-slate-800/80 transition-all shrink-0 hover:border-cyan-700/60"
            >
              <span className="text-[11px] font-mono text-cyan-400 mr-1.5">
                [{p.lang === 'bn' ? 'বাংলা' : 'EN'}]
              </span>
              {p.text}
            </button>
          ))}
        </div>
      )}

      {/* Listening Waveform Banner */}
      {isListening && (
        <div className="px-6 py-2 bg-gradient-to-r from-cyan-950/80 via-indigo-950/80 to-purple-950/80 border-t border-cyan-800/60 flex items-center justify-between text-xs text-cyan-300 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-4 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-6 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="w-1.5 h-5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
            </div>
            <span>Listening for voice commands in <strong>{voiceLanguage === 'bn-BD' ? 'Bangla (বাংলা)' : 'English (US)'}</strong>... Speak naturally!</span>
          </div>
          <button
            onClick={toggleSpeechRecognition}
            className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[11px] hover:bg-rose-900"
          >
            Stop Listening
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/90 backdrop-blur z-20">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-2">
          {/* Voice input language switch */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 shrink-0 text-xs">
            <button
              type="button"
              onClick={() => onChangeVoiceLanguage('bn-BD')}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                voiceLanguage === 'bn-BD'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Recognize voice in Bengali (বাংলা)"
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => onChangeVoiceLanguage('en-US')}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                voiceLanguage === 'en-US'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Recognize voice in English"
            >
              EN
            </button>
          </div>

          {/* Microphone Voice Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-3 rounded-xl border transition-all shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border-slate-800'
            }`}
            title={isListening ? 'Stop listening' : `Start voice command (${voiceLanguage === 'bn-BD' ? 'বাংলা' : 'English'})`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input Box */}
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
              placeholder="Ask Shihab AI in বাংলা or English (e.g., 'সকাল ৭টায় এলার্ম দাও', 'Open Chrome on PC')..."
              className="w-full rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 placeholder-slate-500 px-4 py-3 text-sm resize-none focus:outline-none min-h-[46px] max-h-32 transition-colors"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
            title="Send prompt"
          >
            {isThinking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// Sub-component: Function Call Card inside message
interface FunctionCallCardProps {
  call: FunctionCallItem;
  messageId: string;
  agentStatus: PCAgentStatus;
  onExecute: () => void;
  onReject: () => void;
}

const FunctionCallCard: React.FC<FunctionCallCardProps> = ({
  call,
  agentStatus,
  onExecute,
  onReject,
}) => {
  const { name, args, status, result, error } = call;

  if (name === 'manage_alarm') {
    return (
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-800/50 shadow-sm text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <Bell className="w-4 h-4" />
            <span>Alarm Tool Activated: {args.action?.toUpperCase()}</span>
          </div>
          <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
            {args.time || 'Time Specified'}
          </span>
        </div>
        <div className="text-slate-300">
          <strong>Label:</strong> {args.label || 'Alarm'}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Alarm scheduled in Shihab AI Automation Engine</span>
        </div>
      </div>
    );
  }

  if (name === 'manage_reminder') {
    return (
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-800/50 shadow-sm text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold">
            <Calendar className="w-4 h-4" />
            <span>Reminder Configured</span>
          </div>
          <span className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold ${
            args.priority === 'high' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'
          }`}>
            {args.priority || 'medium'} priority
          </span>
        </div>
        <div className="text-slate-200 font-medium">{args.title}</div>
        <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-2">
          <span>Due: {args.datetime}</span>
          {args.category && <span>• Category: {args.category}</span>}
        </div>
      </div>
    );
  }

  if (name === 'pc_launch_application' || name === 'pc_file_manager' || name === 'pc_system_control') {
    const isAppLaunch = name === 'pc_launch_application';
    const isFileOp = name === 'pc_file_manager';
    const isSysOp = name === 'pc_system_control';

    const targetDesc = isAppLaunch 
      ? `Launch application '${args.appName}'` 
      : isFileOp 
        ? `${args.operation} on path '${args.path}'` 
        : `System action '${args.action}'`;

    return (
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 shadow-md text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <span>Local Windows Action: {name.replace('pc_', '').replace(/_/g, ' ')}</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
            agentStatus.connected
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : 'bg-rose-950 text-rose-300 border border-rose-800'
          }`}>
            {agentStatus.connected ? 'AGENT READY' : 'AGENT OFFLINE'}
          </span>
        </div>

        <div className="text-slate-300 mb-2">
          Target: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-300 font-mono">{targetDesc}</code>
        </div>

        {/* Warning if agent is not connected */}
        {!agentStatus.connected && (
          <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 flex items-start gap-2 mb-2 text-[11px]">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Local Python Windows Agent is Offline</p>
              <p className="text-slate-400 text-[10px] mt-0.5">
                Shihab AI never simulates actions without actual confirmation. Please start <code className="text-amber-200">python shihab_agent.py</code> on your Windows PC to execute on real hardware.
              </p>
            </div>
          </div>
        )}

        {/* Result status */}
        {status === 'completed' && (
          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="font-medium">{result?.message || 'Action executed and verified by Windows agent'}</p>
              {result?.pid && <p className="text-[10px] font-mono text-emerald-400">Windows PID: {result.pid}</p>}
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-center gap-2 text-xs">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Execution failed: {error || 'Error contacting PC agent'}</span>
          </div>
        )}

        {status === 'rejected' && (
          <div className="p-2 rounded-lg bg-slate-800 text-slate-400 flex items-center gap-2 text-xs">
            <XCircle className="w-4 h-4 text-slate-500" />
            <span>Action was rejected by user.</span>
          </div>
        )}

        {/* Pending confirmation controls */}
        {status === 'pending_confirmation' && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
            <button
              onClick={onExecute}
              disabled={!agentStatus.connected}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Authorize & Execute</span>
            </button>
            <button
              onClick={onReject}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Decline
            </button>
          </div>
        )}
      </div>
    );
  }

  if (name === 'draft_social_message') {
    const isWhatsApp = args.platform === 'whatsapp';
    const encodedText = encodeURIComponent(args.messageContent || '');
    const cleanPhone = (args.contactInfo || '').replace(/[^0-9]/g, '');
    const whatsappWebUrl = cleanPhone 
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://web.whatsapp.com/send?text=${encodedText}`;
    const whatsappAppUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;
    const messengerUrl = args.contactInfo 
      ? `https://m.me/${args.contactInfo}`
      : `https://www.messenger.com`;

    const activeSendUrl = isWhatsApp ? whatsappWebUrl : messengerUrl;

    return (
      <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-600/60 shadow-lg text-xs space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-emerald-400">
            <Share2 className="w-4 h-4" />
            <span>{isWhatsApp ? 'WhatsApp Auto-Linked Assistant' : 'Messenger Assistant'}</span>
            {args.isReply && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold">
                SMART REPLY
              </span>
            )}
          </div>
          <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
            Tone: {args.tone || 'polite'}
          </span>
        </div>

        {/* Replying Context if present */}
        {args.replyToSnippet && (
          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-1.5">
            <span className="text-cyan-400 font-bold shrink-0">↩ Replying to:</span>
            <span className="italic truncate text-slate-300">"{args.replyToSnippet}"</span>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-300">
          <div>
            To: <strong>{args.recipientName}</strong> {args.contactInfo && <span className="font-mono text-cyan-300 ml-1">({args.contactInfo})</span>}
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            Auto-Linked
          </span>
        </div>

        {/* Pre-formatted Message Content */}
        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs whitespace-pre-wrap font-sans leading-relaxed shadow-inner">
          {args.messageContent}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {isWhatsApp ? (
            <>
              <a
                href={whatsappWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  navigator.clipboard.writeText(args.messageContent || '');
                  soundEffects.playSuccess();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/30 text-xs transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Send via WhatsApp Web</span>
              </a>

              <a
                href={whatsappAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 text-xs transition-colors"
                title="Open in WhatsApp Desktop or Mobile"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>wa.me Link</span>
              </a>
            </>
          ) : (
            <a
              href={messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 shadow-md text-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Messenger</span>
            </a>
          )}

          <button
            onClick={() => {
              navigator.clipboard.writeText(args.messageContent || '');
              soundEffects.playSuccess();
              alert('Copied reply message to clipboard!');
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 text-xs transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Reply</span>
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(activeSendUrl);
              soundEffects.playSuccess();
              alert('Copied direct WhatsApp link to clipboard!');
            }}
            className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            title="Copy auto-generated WhatsApp URL"
          >
            Copy Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
      <div className="font-mono font-medium text-slate-300">{name}</div>
      <pre className="mt-1 text-[11px] bg-slate-950 p-2 rounded overflow-x-auto text-slate-400">
        {JSON.stringify(args, null, 2)}
      </pre>
    </div>
  );
};
