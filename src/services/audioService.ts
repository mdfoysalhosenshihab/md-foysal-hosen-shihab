/**
 * Audio Service for Shihab AI
 * - Synthesizes alarm chimes and notification sounds using Web Audio API
 * - Handles bilingual Text-to-Speech (Bangla & English)
 * - Manages Web Speech Recognition for hands-free voice commands
 */

let audioCtx: AudioContext | null = null;
let currentAlarmInterval: number | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const soundEffects = {
  // Pleasant futuristic confirmation chime
  playSuccess: () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio effect error:', e);
    }
  },

  // Soft reminder chime (3-harmonic chord)
  playReminder: () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);

        gain.gain.setValueAtTime(0.15, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.5);
      });
    } catch (e) {
      console.warn('Audio effect error:', e);
    }
  },

  // Loud, urgent repeating alarm sound
  startAlarmLoop: () => {
    if (currentAlarmInterval) return;
    const playBeep = () => {
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        osc2.frequency.setValueAtTime(920, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.28);
        osc2.stop(now + 0.28);
      } catch (e) {
        console.warn('Alarm audio error:', e);
      }
    };

    playBeep();
    currentAlarmInterval = window.setInterval(playBeep, 600);
  },

  stopAlarmLoop: () => {
    if (currentAlarmInterval) {
      clearInterval(currentAlarmInterval);
      currentAlarmInterval = null;
    }
  },
};

// Text-to-Speech (TTS)
export const ttsService = {
  speak: (text: string, lang: 'bn' | 'en' = 'en', rate: number = 1.0) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any active speech

    // Clean markdown symbols for clearer verbal delivery
    const cleanText = text
      .replace(/[*#_`>~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Detect language or use requested
    const isBengali = lang === 'bn' || /[\u0980-\u09FF]/.test(cleanText);
    utterance.lang = isBengali ? 'bn-BD' : 'en-US';

    const voices = window.speechSynthesis.getVoices();
    if (isBengali) {
      const bnVoice = voices.find(v => v.lang.startsWith('bn'));
      if (bnVoice) utterance.voice = bnVoice;
    } else {
      const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Zira') || v.name.includes('David')));
      if (enVoice) utterance.voice = enVoice;
    }

    window.speechSynthesis.speak(utterance);
  },

  stop: () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },

  isSpeaking: () => {
    return 'speechSynthesis' in window && window.speechSynthesis.speaking;
  },
};

// Web Speech Recognition (STT)
export interface SpeechRecognitionController {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

export function initSpeechRecognition(
  lang: 'bn-BD' | 'en-US',
  onResult: (transcript: string) => void,
  onError: (err: string) => void,
  onStateChange: (listening: boolean) => void
): SpeechRecognitionController {
  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    return {
      start: () => onError('Web Speech API is not supported in this browser.'),
      stop: () => {},
      isSupported: false,
    };
  }

  const recognition = new SpeechRecognitionClass();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = lang;

  recognition.onstart = () => {
    onStateChange(true);
  };

  recognition.onresult = (event: any) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    onResult(transcript);
  };

  recognition.onerror = (event: any) => {
    onStateChange(false);
    if (event.error !== 'no-speech') {
      onError(`Speech recognition error: ${event.error}`);
    }
  };

  recognition.onend = () => {
    onStateChange(false);
  };

  return {
    start: () => {
      try {
        recognition.lang = lang;
        recognition.start();
      } catch (e: any) {
        console.warn('SpeechRecognition start failed:', e);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {
        // ignore
      }
    },
    isSupported: true,
  };
}
