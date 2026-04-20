'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Terminal,
  X,
  Minus,
  Maximize2,
  ChevronUp,
  ChevronDown,
  Trash2,
  HelpCircle,
  Wifi,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  useOpenClawStore,
  type TerminalLine,
  type TerminalLineType,
} from '@/store/openclaw-store';

// ---------------------------------------------------------------------------
// Mock command responses
// ---------------------------------------------------------------------------

const HELP_RESPONSE: Omit<TerminalLine, 'id' | 'timestamp'>[] = [
  { type: 'output', content: '' },
  {
    type: 'output',
    content: '  OpenClaw Terminal — Available Commands',
  },
  { type: 'output', content: '  ────────────────────────────────────────' },
  { type: 'output', content: '  help              Show this help message' },
  { type: 'output', content: '  status            Gateway status overview' },
  { type: 'output', content: '  version           Show version info' },
  { type: 'output', content: '  mcp list          List MCP servers' },
  { type: 'output', content: '  mcp serve         Start MCP server' },
  { type: 'output', content: '  plugins list      List installed plugins' },
  { type: 'output', content: '  agents list       List active agents' },
  { type: 'output', content: '  models list       List configured models' },
  { type: 'output', content: '  clear             Clear terminal output' },
  { type: 'output', content: '' },
];

function statusResponse(): Omit<TerminalLine, 'id' | 'timestamp'>[] {
  const { system, terminal } = useOpenClawStore.getState();
  const hours = Math.floor(system.uptime / 3600);
  const mins = Math.floor((system.uptime % 3600) / 60);
  return [
    { type: 'output', content: '' },
    { type: 'output', content: '  OpenClaw Gateway Status' },
    { type: 'output', content: '  ────────────────────────────────────────' },
    { type: 'output', content: `  Status          ${system.gatewayStatus.toUpperCase()}` },
    { type: 'output', content: `  Uptime          ${hours}h ${mins}m` },
    { type: 'output', content: `  Memory          ${system.memoryUsage}%` },
    { type: 'output', content: `  Connections     ${system.activeConnections}` },
    { type: 'output', content: `  Connected       ${terminal.isConnected ? 'Yes' : 'No'}` },
    { type: 'output', content: `  Directory       ${terminal.currentDirectory}` },
    { type: 'output', content: '' },
  ];
}

function mcpListResponse(): Omit<TerminalLine, 'id' | 'timestamp'>[] {
  const { mcpServers } = useOpenClawStore.getState();
  const lines: Omit<TerminalLine, 'id' | 'timestamp'>[] = [
    { type: 'output', content: '' },
    { type: 'output', content: '  MCP Servers' },
    { type: 'output', content: '  ────────────────────────────────────────' },
  ];
  mcpServers.forEach((srv) => {
    const icon = srv.status === 'connected' ? '✓' : srv.status === 'error' ? '✗' : '○';
    const statusColor = srv.status === 'connected' ? 'output' : 'error';
    lines.push({
      type: statusColor,
      content: `  ${icon} ${srv.name.padEnd(18)} [${srv.status}]  ${srv.transport}  (${srv.tools.length} tools)`,
    });
  });
  lines.push({ type: 'output', content: '' });
  return lines;
}

function mcpServeResponse(): Omit<TerminalLine, 'id' | 'timestamp'>[] {
  return [
    { type: 'output', content: '' },
    { type: 'system', content: 'Starting MCP server on stdio transport...' },
    { type: 'output', content: '  ✓ Server process spawned (PID 48291)' },
    { type: 'output', content: '  ✓ Transport initialized: stdio' },
    { type: 'output', content: '  ✓ 5 tools registered' },
    { type: 'output', content: '  ✓ MCP server ready.' },
    { type: 'output', content: '' },
  ];
}

function pluginsListResponse(): Omit<TerminalLine, 'id' | 'timestamp'>[] {
  const { plugins } = useOpenClawStore.getState();
  const lines: Omit<TerminalLine, 'id' | 'timestamp'>[] = [
    { type: 'output', content: '' },
    { type: 'output', content: '  Installed Plugins' },
    { type: 'output', content: '  ────────────────────────────────────────' },
  ];
  plugins.forEach((p) => {
    const icon = p.status === 'running' ? '●' : p.status === 'stopped' ? '○' : '◌';
    lines.push({
      type: 'output',
      content: `  ${icon} ${p.name.padEnd(20)} v${p.version.padEnd(8)} [${p.status}]`,
    });
  });
  lines.push({ type: 'output', content: '' });
  return lines;
}

function agentsListResponse(): Omit<TerminalLine, 'id' | 'timestamp'>[] {
  const { agents } = useOpenClawStore.getState();
  const lines: Omit<TerminalLine, 'id' | 'timestamp'>[] = [
    { type: 'output', content: '' },
    { type: 'output', content: '  Active Agents' },
    { type: 'output', content: '  ────────────────────────────────────────' },
  ];
  agents.forEach((a) => {
    const icon =
      a.status === 'active' ? '●' : a.status === 'busy' ? '◉' : a.status === 'idle' ? '○' : '✗';
    lines.push({
      type: 'output',
      content: `  ${icon} ${a.name.padEnd(10)} ${a.model.padEnd(22)} [${a.status}] ${a.sessions} sessions`,
    });
  });
  lines.push({ type: 'output', content: '' });
  return lines;
}

function modelsListResponse(): Omit<TerminalLine, 'id' | 'timestamp'>[] {
  const { modelProviders } = useOpenClawStore.getState();
  const lines: Omit<TerminalLine, 'id' | 'timestamp'>[] = [
    { type: 'output', content: '' },
    { type: 'output', content: '  Configured Model Providers' },
    { type: 'output', content: '  ────────────────────────────────────────' },
  ];
  modelProviders.forEach((m) => {
    const icon = m.status === 'active' ? '✓' : m.status === 'degraded' ? '⚠' : '✗';
    const latency = m.latency ? `${m.latency}ms` : 'N/A';
    const key = m.apiKeyConfigured ? 'key ✓' : 'key ✗';
    lines.push({
      type: 'output',
      content: `  ${icon} ${m.name.padEnd(22)} [${m.status}] ${latency.padEnd(8)} ${key}`,
    });
  });
  lines.push({ type: 'output', content: '' });
  return lines;
}

const VERSION_RESPONSE: Omit<TerminalLine, 'id' | 'timestamp'>[] = [
  { type: 'output', content: '' },
  { type: 'output', content: '  OpenClaw Gateway v2.4.1' },
  { type: 'output', content: '  CLI v1.0.0' },
  { type: 'output', content: '  Protocol: MCP 2024-11-05' },
  { type: 'output', content: '  Runtime: Node.js 22.x' },
  { type: 'output', content: '' },
];

function processCommand(
  raw: string,
): Omit<TerminalLine, 'id' | 'timestamp'>[] | null {
  const cmd = raw.trim().toLowerCase();
  if (!cmd) return null;
  if (cmd === 'clear') return null; // handled specially
  if (cmd === 'help') return HELP_RESPONSE;
  if (cmd === 'status') return statusResponse();
  if (cmd === 'version') return VERSION_RESPONSE;
  if (cmd === 'mcp list') return mcpListResponse();
  if (cmd === 'mcp serve') return mcpServeResponse();
  if (cmd === 'plugins list') return pluginsListResponse();
  if (cmd === 'agents list') return agentsListResponse();
  if (cmd === 'models list') return modelsListResponse();
  return [
    {
      type: 'error',
      content: `  Command not found: ${raw.trim()}. Type 'help' for available commands.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Terminal line renderer
// ---------------------------------------------------------------------------

function TerminalLineView({
  type,
  content,
}: {
  type: TerminalLineType;
  content: string;
}) {
  const base = 'whitespace-pre-wrap break-words leading-relaxed text-[13px]';

  switch (type) {
    case 'system':
      return <div className={`${base} text-gray-500 select-none`}>{content}</div>;
    case 'output':
      return <div className={`${base} text-green-400`}>{content}</div>;
    case 'error':
      return <div className={`${base} text-red-400`}>{content}</div>;
    case 'input':
      return (
        <div className={`${base} text-white`}>
          <span className="text-emerald-500 font-semibold">{'> '}</span>
          <span>{content}</span>
        </div>
      );
    default:
      return <div className={base}>{content}</div>;
  }
}

// ---------------------------------------------------------------------------
// TerminalContent
// ---------------------------------------------------------------------------

export function TerminalContent() {
  const {
    terminal,
    addTerminalLine,
    addTerminalLines,
    pushCommandHistory,
    clearTerminal,
  } = useOpenClawStore();

  const [input, setInput] = useState('');
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const linesEndRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    linesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminal.lines.length]);

  // Focus input when clicking the terminal body
  const handleTerminalClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Submit command
  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Echo input line
    addTerminalLine({ type: 'input', content: trimmed });
    pushCommandHistory(trimmed);

    // Handle clear
    if (trimmed.toLowerCase() === 'clear') {
      clearTerminal();
      setInput('');
      setHistoryIdx(-1);
      return;
    }

    // Process command with simulated delay
    const delay = 80 + Math.random() * 220;
    setTimeout(() => {
      const response = processCommand(trimmed);
      if (response) {
        addTerminalLines(response);
      }
    }, delay);

    setInput('');
    setHistoryIdx(-1);
  }, [input, addTerminalLine, addTerminalLines, pushCommandHistory, clearTerminal]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const { commandHistory } = useOpenClawStore.getState().terminal;
        if (commandHistory.length === 0) return;
        const newIdx =
          historyIdx === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(commandHistory[newIdx]);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const { commandHistory } = useOpenClawStore.getState().terminal;
        if (historyIdx === -1) return;
        const newIdx = historyIdx + 1;
        if (newIdx >= commandHistory.length) {
          setHistoryIdx(-1);
          setInput('');
        } else {
          setHistoryIdx(newIdx);
          setInput(commandHistory[newIdx]);
        }
        return;
      }
    },
    [handleSubmit, historyIdx],
  );

  const quickCommand = useCallback(
    (cmd: string) => {
      addTerminalLine({ type: 'input', content: cmd });
      pushCommandHistory(cmd);

      if (cmd.toLowerCase() === 'clear') {
        clearTerminal();
        return;
      }

      const delay = 80 + Math.random() * 220;
      setTimeout(() => {
        const response = processCommand(cmd);
        if (response) {
          addTerminalLines(response);
        }
      }, delay);
    },
    [addTerminalLine, addTerminalLines, pushCommandHistory, clearTerminal],
  );

  const uptime = useOpenClawStore((s) => s.system.uptime);
  const hours = Math.floor(uptime / 3600);
  const mins = Math.floor((uptime % 3600) / 60);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden rounded-lg border border-gray-800 bg-gray-950 shadow-2xl">
      {/* ---- Main terminal area ---- */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2 select-none">
          <div className="flex items-center gap-3">
            {/* Traffic light dots */}
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
              <span className="inline-block h-3 w-3 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.4)]" />
              <span className="inline-block h-3 w-3 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
            </div>
            <Separator orientation="vertical" className="h-4 bg-gray-700" />
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="font-medium">OpenClaw Terminal</span>
              <Badge
                variant="outline"
                className="border-gray-700 bg-gray-800 text-gray-400 text-[10px] px-1.5"
              >
                v2.4.1
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                  onClick={() => quickCommand('clear')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Clear</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                  onClick={() => setSidePanelOpen((o) => !o)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {sidePanelOpen ? 'Hide Panel' : 'Show Panel'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                  onClick={() => {
                    const el = document.documentElement;
                    if (!document.fullscreenElement) {
                      el.requestFullscreen?.();
                    } else {
                      document.exitFullscreen?.();
                    }
                  }}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Fullscreen</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Terminal output */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3 font-mono bg-gray-950 cursor-text"
          ref={scrollRef}
          onClick={handleTerminalClick}
        >
          {terminal.lines.map((line) => (
            <TerminalLineView
              key={line.id}
              type={line.type}
              content={line.content}
            />
          ))}
          <div ref={linesEndRef} />
        </div>

        {/* Input line */}
        <div className="border-t border-gray-800 bg-gray-900/80 px-4 py-2.5 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold text-sm whitespace-nowrap">
              openclaw $
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-white text-sm outline-none caret-emerald-400 placeholder-gray-600"
              placeholder={historyIdx >= 0 ? '' : 'Type a command... (tab to autocomplete)'}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            <div className="flex items-center gap-0.5 text-gray-600">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-gray-600 hover:text-gray-400 hover:bg-gray-800"
                tabIndex={-1}
                onClick={() => {
                  const { commandHistory } = useOpenClawStore.getState().terminal;
                  if (commandHistory.length === 0) return;
                  const newIdx =
                    historyIdx === -1
                      ? commandHistory.length - 1
                      : Math.max(0, historyIdx - 1);
                  setHistoryIdx(newIdx);
                  setInput(commandHistory[newIdx]);
                }}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-gray-600 hover:text-gray-400 hover:bg-gray-800"
                tabIndex={-1}
                onClick={() => {
                  const { commandHistory } = useOpenClawStore.getState().terminal;
                  if (historyIdx === -1) return;
                  const newIdx = historyIdx + 1;
                  if (newIdx >= commandHistory.length) {
                    setHistoryIdx(-1);
                    setInput('');
                  } else {
                    setHistoryIdx(newIdx);
                    setInput(commandHistory[newIdx]);
                  }
                }}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Side panel ---- */}
      {sidePanelOpen && (
        <div className="w-64 border-l border-gray-800 bg-gray-900 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">
                Terminal Info
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                onClick={() => setSidePanelOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Connection status */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Connection
              </span>
              <div className="flex items-center gap-2">
                <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-sm text-emerald-400">
                  {terminal.isConnected ? 'Connected' : 'Disconnected'}
                </span>
                <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                wss://gateway.openclaw.dev
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* Session info */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Session
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>Uptime</span>
                  <span className="ml-auto text-gray-300">
                    {hours}h {mins}m
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Terminal className="h-3 w-3" />
                  <span>Commands</span>
                  <span className="ml-auto text-gray-300">
                    {terminal.commandHistory.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="h-3 w-3 inline-block rounded bg-gray-700 text-[8px] text-center leading-3">
                    ~
                  </span>
                  <span>Working Dir</span>
                  <span className="ml-auto text-gray-300 text-[10px] max-w-[120px] truncate">
                    {terminal.currentDirectory}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* Quick commands */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Quick Commands
              </span>
              <div className="flex flex-col gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 justify-start text-xs text-gray-400 hover:text-white hover:bg-gray-800 px-2 font-mono"
                  onClick={() => quickCommand('help')}
                >
                  <HelpCircle className="h-3 w-3 mr-2 text-gray-500" />
                  help
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 justify-start text-xs text-gray-400 hover:text-white hover:bg-gray-800 px-2 font-mono"
                  onClick={() => quickCommand('status')}
                >
                  <Activity className="h-3 w-3 mr-2 text-gray-500" />
                  status
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 justify-start text-xs text-gray-400 hover:text-white hover:bg-gray-800 px-2 font-mono"
                  onClick={() => quickCommand('agents list')}
                >
                  <Bot className="h-3 w-3 mr-2 text-gray-500" />
                  agents list
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 justify-start text-xs text-gray-400 hover:text-white hover:bg-gray-800 px-2 font-mono"
                  onClick={() => quickCommand('clear')}
                >
                  <Trash2 className="h-3 w-3 mr-2 text-gray-500" />
                  clear
                </Button>
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* Legend */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Legend
              </span>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-mono">●</span>
                  <span className="text-gray-500">Output / Success</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-400 font-mono">●</span>
                  <span className="text-gray-500">Error</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-mono">●</span>
                  <span className="text-gray-500">System</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">●</span>
                  <span className="text-gray-500">Input</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline icon for quick commands (replacing lucide for self-containment)
function Bot({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

function Activity({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  );
}
