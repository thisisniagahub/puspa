'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Send, Bot, User, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// ─── Types ─────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

// ─── Data ──────────────────────────────────────────────────────────────

const QUICK_QUESTIONS = [
  'Apakah program yang ditawarkan PUSPA?',
  'Bagaimana untuk mendaftar sebagai sukarela?',
  'Di manakah lokasi operasi PUSPA?',
  'Bagaimana untuk membuat sumbangan?',
];

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'ai',
  content: 'Assalamualaikum! Saya pembantu maya PUSPA. Boleh saya bantu anda?',
  timestamp: new Date(),
};

// ─── Helpers ───────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ms-MY', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Typing Indicator ──────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <Avatar className="mt-0.5 size-8 shrink-0 border border-emerald-200">
        <AvatarImage src="/puspa-logo.png" alt="PUSPA" />
        <AvatarFallback className="bg-emerald-100">
          <Bot className="size-4 text-emerald-700" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 dark:bg-gray-800">
        <span className="typing-dot size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
        <span className="typing-dot size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
        <span className="typing-dot size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────

export default function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
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
        content: data.reply || 'Maaf, saya tidak dapat menjawab pertanyaan tersebut.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'ai',
        content:
          'Maaf, berlaku ralat semasa memproses permintaan anda. Sila cuba lagi sebentar.',
        timestamp: new Date(),
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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-t-xl border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 dark:border-gray-700">
        <div className="flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <MessageCircle className="size-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">PUSPA AI Assistant</h3>
          <p className="flex items-center gap-1.5 text-xs text-emerald-100">
            <span className="inline-block size-1.5 rounded-full bg-emerald-300" />
            Dalam talian
          </p>
        </div>
        <Sparkles className="size-5 text-emerald-200" />
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '320px' }}>
        <div ref={scrollRef} className="space-y-4 p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              {msg.role === 'ai' ? (
                <Avatar className="mt-0.5 size-8 shrink-0 border border-emerald-200">
                  <AvatarImage src="/puspa-logo.png" alt="PUSPA" />
                  <AvatarFallback className="bg-emerald-100">
                    <Bot className="size-4 text-emerald-700" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="mt-0.5 size-8 shrink-0 border border-blue-200">
                  <AvatarFallback className="bg-blue-100">
                    <User className="size-4 text-blue-700" />
                  </AvatarFallback>
                </Avatar>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[75%] space-y-1 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm bg-emerald-600 text-white dark:bg-emerald-700'
                      : 'rounded-tl-sm bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  {msg.content}
                </div>
                <p
                  className={`text-[10px] text-muted-foreground ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Quick Questions */}
      {messages.length <= 1 && !isLoading && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/50">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Soalan pantas:
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleQuickQuestion(q)}
                className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-800 dark:bg-gray-900 dark:text-emerald-400 dark:hover:bg-emerald-950"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
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
            className="size-9 shrink-0 bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="size-4" />
            <span className="sr-only">Hantar</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
