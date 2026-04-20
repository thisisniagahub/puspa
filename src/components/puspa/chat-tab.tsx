'use client';

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Bot,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  Copy,
  MessageCircle,
  Sparkles,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// ─── Types ─────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number; // store as ms timestamp for JSON serialization
}

interface QuickQuestionGroup {
  label: string;
  questions: string[];
}

// ─── Data ──────────────────────────────────────────────────────────────

const QUICK_QUESTIONS: QuickQuestionGroup[] = [
  {
    label: 'Tentang PUSPA',
    questions: [
      'Apakah program yang ditawarkan PUSPA?',
      'Siapakah jawatankuasa PUSPA?',
    ],
  },
  {
    label: 'Untuk Ahli',
    questions: [
      'Bagaimana untuk mendaftar sebagai sukarela?',
      'Apakah kelayakan untuk menerima bantuan?',
    ],
  },
  {
    label: 'Sumbangan',
    questions: [
      'Bagaimana untuk membuat sumbangan?',
      'Adakah sumbangan pemotongan cukai?',
    ],
  },
];

const STORAGE_KEY = 'puspa-chat-history';
const MAX_MESSAGES = 50;

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'ai',
  content:
    'Assalamualaikum! 👋 Saya pembantu maya **PUSPA**. Boleh saya bantu anda?\n\nAnda boleh bertanya tentang program, keahlian, sumbangan, atau apa-apa perkara berkaitan PUSPA.',
  timestamp: Date.now(),
};

// ─── Helpers ───────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ms-MY', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChatMessage[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore parse errors
  }
  return [WELCOME_MESSAGE];
}

function saveMessages(messages: ChatMessage[]) {
  try {
    // Keep only last MAX_MESSAGES (always keep welcome if present)
    const toSave = messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore storage errors
  }
}

// ─── Typing Indicator ──────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <Avatar className="mt-0.5 size-8 shrink-0 border border-purple-200">
        <AvatarImage src="/puspa-logo-official.png" alt="PUSPA" />
        <AvatarFallback className="bg-purple-100">
          <Bot className="size-4 text-purple-700" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-3 dark:from-gray-800 dark:to-gray-800">
        <span className="typing-dot size-2 animate-bounce rounded-full bg-purple-400 [animation-delay:0ms]" />
        <span className="typing-dot size-2 animate-bounce rounded-full bg-purple-400 [animation-delay:150ms]" />
        <span className="typing-dot size-2 animate-bounce rounded-full bg-purple-400 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-950/30">
        <Sparkles className="size-10 text-purple-500" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-200">
        PUSPA AI Assistant
      </h3>
      <p className="max-w-xs text-sm text-muted-foreground">
        Mulakan perbualan dengan bertanya tentang program, keahlian, atau sumbangan PUSPA.
      </p>
    </div>
  );
}

// ─── Copy Button ───────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      title="Salin mesej"
    >
      {copied ? <Check className="size-3.5 text-purple-500" /> : <Copy className="size-3.5" />}
    </button>
  );
}

// ─── Speak Button (TTS) ────────────────────────────────────────────────

function SpeakButton({ text }: { text: string }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = useCallback(() => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Strip markdown syntax for TTS
    const cleanText = text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[-*+]\s/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ', ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ms-MY';
    utterance.rate = 0.95;

    // Try to find Malay voice
    const voices = window.speechSynthesis.getVoices();
    const msVoice = voices.find(
      (v) => v.lang.startsWith('ms') || v.lang === 'ms-MY'
    );
    if (msVoice) {
      utterance.voice = msVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [text, isSpeaking]);

  // If speech synthesis not supported, hide button
  if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
    return null;
  }

  return (
    <button
      onClick={handleSpeak}
      className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
        isSpeaking
          ? 'text-purple-500 animate-pulse'
          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
      }`}
      title={isSpeaking ? 'Henti bunyi' : 'Baca mesej'}
    >
      {isSpeaking ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
    </button>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const [hovered, setHovered] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex items-start gap-2.5 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {isUser ? (
        <Avatar className="mt-0.5 size-8 shrink-0 border border-purple-200">
          <AvatarFallback className="bg-purple-100 dark:bg-purple-900/50">
            <User className="size-4 text-purple-700 dark:text-purple-400" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="mt-0.5 size-8 shrink-0 border border-purple-200">
          <AvatarImage src="/puspa-logo-official.png" alt="PUSPA" />
          <AvatarFallback className="bg-purple-100 dark:bg-purple-900/50">
            <Bot className="size-4 text-purple-700 dark:text-purple-400" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Content */}
      <div
        className={`max-w-[80%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}
      >
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-sm bg-purple-600 text-white dark:bg-purple-700 dark:text-purple-50'
              : 'rounded-tl-sm bg-gradient-to-br from-gray-50 to-gray-100/80 text-gray-900 dark:from-gray-800 dark:to-gray-800/80 dark:text-gray-100'
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-code:rounded prose-code:bg-purple-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-purple-800 prose-code:before:content-none prose-code:after:content-none dark:prose-invert dark:prose-code:bg-purple-900/40 dark:prose-code:text-purple-300">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Timestamp & Action Buttons (hover only) */}
        <div
          className={`flex items-center gap-1 transition-opacity duration-200 ${
            isUser ? 'flex-row-reverse' : 'flex-row'
          } ${hovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
          {!isUser && (
            <div className="flex items-center gap-0.5">
              <SpeakButton text={message.content} />
              <CopyButton text={message.content} />
            </div>
          )}
          {isUser && <CopyButton text={message.content} />}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export default function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesInitialized = useRef(false);

  // Initialize messages from localStorage
  useEffect(() => {
    if (!messagesInitialized.current) {
      setMessages(loadMessages());
      messagesInitialized.current = true;
    }
  }, []);

  // Save messages to localStorage on change
  useEffect(() => {
    if (messagesInitialized.current) {
      saveMessages(messages);
    }
  }, [messages]);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);

    // Pre-load voices for TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleSend = async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'ai',
        content:
          data.reply || 'Maaf, saya tidak dapat menjawab pertanyaan tersebut.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'ai',
        content:
          'Maaf, berlaku ralat semasa memproses permintaan anda. Sila cuba lagi sebentar.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSend(question);
  };

  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([WELCOME_MESSAGE]);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // ─── Voice Input (ASR) ────────────────────────────────────────────

  const toggleVoiceInput = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // If already listening, stop
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ms-MY';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening]);

  const hasOnlyWelcome = messages.length <= 1;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-t-xl border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-3 dark:border-gray-700">
        <div className="flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <MessageCircle className="size-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">PUSPA AI Assistant</h3>
          <p className="flex items-center gap-1.5 text-xs text-purple-100">
            <span className="inline-block size-1.5 rounded-full bg-purple-300" />
            Dalam talian
          </p>
        </div>
        <Sparkles className="size-5 text-purple-200" />

        {/* Clear History Button */}
        {!hasOnlyWelcome && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-white/80 hover:bg-white/20 hover:text-white"
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Kosongkan sembang</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" side="bottom" align="end">
              <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                Kosongkan semua sejarah sembang?
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearHistory}
                className="w-full"
              >
                <Trash2 className="mr-1.5 size-3.5" />
                Kosongkan sembang
              </Button>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea
        className="flex-1"
        style={{ maxHeight: 'calc(100vh - 420px)', minHeight: '280px' }}
      >
        <div
          ref={scrollRef}
          className="relative space-y-4 p-4"
          style={{
            backgroundImage: hasOnlyWelcome && !isLoading
              ? 'none'
              : undefined,
          }}
        >
          {/* Chat background pattern - subtle dots */}
          {!hasOnlyWelcome && (
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
              style={{
                backgroundImage:
                  'radial-gradient(circle, currentColor 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          )}

          {/* Empty State */}
          {hasOnlyWelcome && !isLoading && <EmptyState />}

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Typing Indicator */}
          {isLoading && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Quick Questions (Grouped) */}
      {hasOnlyWelcome && !isLoading && (
        <div className="space-y-3 border-t border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/50">
          {QUICK_QUESTIONS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-xs font-semibold text-purple-700 dark:text-purple-400">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.questions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuickQuestion(q)}
                    className="rounded-full border border-purple-200 bg-white min-h-[44px] px-4 py-2 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-50 hover:border-purple-300 dark:border-purple-800 dark:bg-gray-900 dark:text-purple-400 dark:hover:bg-purple-950"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {/* Voice Input Button */}
          {speechSupported && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleVoiceInput}
              className={`size-9 shrink-0 transition-colors ${
                isListening
                  ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                  : 'text-gray-500 hover:text-purple-600'
              }`}
              title={isListening ? 'Henti mendengar' : 'Input suara'}
            >
              {isListening ? (
                <div className="flex items-center gap-1">
                  <span className="size-2 animate-pulse rounded-full bg-red-500" />
                  <MicOff className="size-4" />
                </div>
              ) : (
                <Mic className="size-4" />
              )}
              <span className="sr-only">
                {isListening ? 'Henti mendengar' : 'Input suara'}
              </span>
            </Button>
          )}

          {isListening && (
            <span className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400">
              <span className="inline-block size-2 animate-pulse rounded-full bg-red-500" />
              Mendengar...
            </span>
          )}

          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Taip soalan anda di sini..."
            disabled={isLoading}
            className="flex-1 border-gray-200 dark:border-gray-700"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="size-9 shrink-0 bg-purple-600 hover:bg-purple-700"
          >
            <Send className="size-4" />
            <span className="sr-only">Hantar</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
