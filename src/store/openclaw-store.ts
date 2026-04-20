import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export type NavigationTab =
  | 'dashboard'
  | 'mcp-servers'
  | 'plugins'
  | 'integrations'
  | 'terminal'
  | 'agents'
  | 'models'
  | 'automation';

export type MCPServerTransport = 'stdio' | 'sse' | 'streamable-http';
export type MCPServerStatus = 'connected' | 'disconnected' | 'error';

export interface MCPTool {
  name: string;
  description: string;
}

export interface MCPServer {
  id: string;
  name: string;
  transport: MCPServerTransport;
  status: MCPServerStatus;
  command?: string;
  args?: string[];
  url?: string;
  tools: MCPTool[];
  lastConnected: string | null;
  description: string;
  enabled: boolean;
}

export type PluginStatus = 'installed' | 'running' | 'stopped' | 'error';
export type PluginSource = 'openclaw' | 'codex' | 'claude' | 'cursor';
export type PluginCategory = 'communication' | 'productivity' | 'ai' | 'integration' | 'media' | 'utilities';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  status: PluginStatus;
  source: PluginSource;
  category: PluginCategory;
  description: string;
  author: string;
  enabled: boolean;
  installedAt: string;
}

export type IntegrationType = 'channel' | 'model' | 'webhook' | 'storage';
export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending';

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  status: IntegrationStatus;
  icon: string;
  description: string;
  configured: boolean;
  lastSync: string | null;
}

export type TerminalLineType = 'input' | 'output' | 'error' | 'system';

export interface TerminalLine {
  id: string;
  type: TerminalLineType;
  content: string;
  timestamp: string;
}

export type AgentStatus = 'idle' | 'active' | 'busy' | 'offline' | 'error';

export interface Agent {
  id: string;
  name: string;
  model: string;
  status: AgentStatus;
  personality: string;
  workspace: string;
  sessions: number;
}

export type ModelProviderStatus = 'active' | 'inactive' | 'error' | 'degraded';

export interface ModelProvider {
  id: string;
  name: string;
  provider: string;
  status: ModelProviderStatus;
  apiKeyConfigured: boolean;
  latency: number | null; // ms
  costPerToken: number | null;
}

export type GatewayStatus = 'online' | 'offline' | 'degraded' | 'starting';

export interface SystemNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// ---------------------------------------------------------------------------
// Store State Interface
// ---------------------------------------------------------------------------

export interface OpenClawState {
  // Navigation
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // MCP Servers
  mcpServers: MCPServer[];
  addMCPServer: (server: MCPServer) => void;
  updateMCPServer: (id: string, updates: Partial<MCPServer>) => void;
  removeMCPServer: (id: string) => void;
  toggleMCPServer: (id: string) => void;

  // Plugins
  plugins: Plugin[];
  addPlugin: (plugin: Plugin) => void;
  updatePlugin: (id: string, updates: Partial<Plugin>) => void;
  removePlugin: (id: string) => void;
  togglePlugin: (id: string) => void;

  // Integrations
  integrations: Integration[];
  addIntegration: (integration: Integration) => void;
  updateIntegration: (id: string, updates: Partial<Integration>) => void;
  removeIntegration: (id: string) => void;

  // Terminal
  terminal: {
    lines: TerminalLine[];
    commandHistory: string[];
    currentDirectory: string;
    isConnected: boolean;
  };
  addTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  addTerminalLines: (lines: Omit<TerminalLine, 'id' | 'timestamp'>[]) => void;
  pushCommandHistory: (command: string) => void;
  setCurrentDirectory: (dir: string) => void;
  clearTerminal: () => void;
  setTerminalConnected: (connected: boolean) => void;

  // Agents
  agents: Agent[];
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;

  // Models
  modelProviders: ModelProvider[];
  addModelProvider: (provider: ModelProvider) => void;
  updateModelProvider: (id: string, updates: Partial<ModelProvider>) => void;
  removeModelProvider: (id: string) => void;

  // System
  system: {
    gatewayStatus: GatewayStatus;
    uptime: number; // seconds
    memoryUsage: number; // percentage 0-100
    activeConnections: number;
    notifications: SystemNotification[];
  };
  setGatewayStatus: (status: GatewayStatus) => void;
  setUptime: (uptime: number) => void;
  setMemoryUsage: (usage: number) => void;
  setActiveConnections: (count: number) => void;
  addNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  dismissNotification: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _idCounter = 0;
function uid(): string {
  return `${Date.now()}-${++_idCounter}`;
}

function isoNow(): string {
  return new Date().toISOString();
}

function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString();
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_MCP_SERVERS: MCPServer[] = [
  {
    id: 'mcp-fs-001',
    name: 'Filesystem',
    transport: 'stdio',
    status: 'connected',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-filesystem', '/home/z/workspace'],
    tools: [
      { name: 'read_file', description: 'Read a file from disk' },
      { name: 'write_file', description: 'Write content to a file' },
      { name: 'list_directory', description: 'List directory contents' },
      { name: 'search_files', description: 'Search for files by pattern' },
      { name: 'get_file_info', description: 'Get file metadata' },
    ],
    lastConnected: minutesAgo(2),
    description: 'Provides secure access to the local filesystem for reading, writing, and searching files.',
    enabled: true,
  },
  {
    id: 'mcp-web-001',
    name: 'Web Search',
    transport: 'sse',
    status: 'connected',
    url: 'https://tools.openclaw.dev/mcp/web-search',
    tools: [
      { name: 'web_search', description: 'Search the web using Google/Bing' },
      { name: 'fetch_url', description: 'Fetch and parse a web page' },
      { name: 'scrape_content', description: 'Extract structured content from a URL' },
    ],
    lastConnected: minutesAgo(5),
    description: 'Enables web search and page fetching capabilities for the agent.',
    enabled: true,
  },
  {
    id: 'mcp-exec-001',
    name: 'Code Executor',
    transport: 'streamable-http',
    status: 'connected',
    url: 'https://sandbox.openclaw.dev/mcp/executor',
    tools: [
      { name: 'execute_code', description: 'Run code in a sandboxed environment' },
      { name: 'install_package', description: 'Install npm/pip packages in the sandbox' },
      { name: 'list_packages', description: 'List installed packages' },
    ],
    lastConnected: minutesAgo(1),
    description: 'Runs arbitrary code (Python, Node.js, etc.) in an isolated sandbox.',
    enabled: true,
  },
  {
    id: 'mcp-db-001',
    name: 'Database',
    transport: 'stdio',
    status: 'error',
    command: 'npx',
    args: ['-y', '@openclaw/mcp-postgres', 'postgresql://localhost:5432/mydb'],
    tools: [
      { name: 'query', description: 'Execute a SQL query' },
      { name: 'list_tables', description: 'List all tables in the database' },
      { name: 'describe_table', description: 'Describe a table schema' },
    ],
    lastConnected: hoursAgo(3),
    description: 'Connects to PostgreSQL databases for querying and schema inspection.',
    enabled: true,
  },
];

const MOCK_PLUGINS: Plugin[] = [
  {
    id: 'plug-webhooks-001',
    name: 'Webhooks',
    version: '2.1.0',
    status: 'running',
    source: 'openclaw',
    category: 'integration',
    description: 'Create and manage webhook endpoints for event-driven workflows and third-party integrations.',
    author: 'OpenClaw Team',
    enabled: true,
    installedAt: daysAgo(14),
  },
  {
    id: 'plug-voice-001',
    name: 'Voice Call',
    version: '1.4.2',
    status: 'running',
    source: 'openclaw',
    category: 'communication',
    description: 'Enables real-time voice calling capabilities with speech-to-text and text-to-speech conversion.',
    author: 'OpenClaw Team',
    enabled: true,
    installedAt: daysAgo(10),
  },
  {
    id: 'plug-memory-001',
    name: 'Memory Wiki',
    version: '3.0.1',
    status: 'running',
    source: 'claude',
    category: 'productivity',
    description: 'Persistent knowledge graph and wiki-style memory that agents use to store and recall information.',
    author: 'Claude Extensions',
    enabled: true,
    installedAt: daysAgo(7),
  },
  {
    id: 'plug-codex-001',
    name: 'Codex Harness',
    version: '0.9.3',
    status: 'installed',
    source: 'codex',
    category: 'ai',
    description: 'Integrates OpenAI Codex for advanced code generation, refactoring, and explanation tasks.',
    author: 'OpenAI',
    enabled: true,
    installedAt: daysAgo(3),
  },
  {
    id: 'plug-zalo-001',
    name: 'Zalo Integration',
    version: '1.2.0',
    status: 'running',
    source: 'openclaw',
    category: 'communication',
    description: 'Connects agents to Zalo messaging platform for Vietnamese market customer support automation.',
    author: 'OpenClaw Team',
    enabled: true,
    installedAt: daysAgo(5),
  },
  {
    id: 'plug-btw-001',
    name: 'BTW Side Questions',
    version: '1.0.0',
    status: 'stopped',
    source: 'claude',
    category: 'utilities',
    description: 'Injects contextual "by the way" side questions into conversations for richer, multi-topic interactions.',
    author: 'Claude Extensions',
    enabled: false,
    installedAt: daysAgo(2),
  },
  {
    id: 'plug-img-001',
    name: 'Image Generation',
    version: '2.3.1',
    status: 'running',
    source: 'openclaw',
    category: 'media',
    description: 'Generates images from text prompts using DALL-E 3 and Stable Diffusion backends.',
    author: 'OpenClaw Team',
    enabled: true,
    installedAt: daysAgo(12),
  },
  {
    id: 'plug-browser-001',
    name: 'Web Browser',
    version: '1.5.4',
    status: 'running',
    source: 'cursor',
    category: 'utilities',
    description: 'Headless browser control for web scraping, testing, and automated navigation workflows.',
    author: 'Cursor Labs',
    enabled: true,
    installedAt: daysAgo(8),
  },
];

const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: 'int-discord-001',
    name: 'Discord',
    type: 'channel',
    status: 'active',
    icon: '💬',
    description: 'Connect your agent to Discord servers for automated responses and community management.',
    configured: true,
    lastSync: minutesAgo(1),
  },
  {
    id: 'int-telegram-001',
    name: 'Telegram',
    type: 'channel',
    status: 'active',
    icon: '✈️',
    description: 'Deploy agents as Telegram bots for one-on-one and group conversations.',
    configured: true,
    lastSync: minutesAgo(3),
  },
  {
    id: 'int-whatsapp-001',
    name: 'WhatsApp',
    type: 'channel',
    status: 'pending',
    icon: '📱',
    description: 'WhatsApp Business API integration for customer support and notifications.',
    configured: false,
    lastSync: null,
  },
  {
    id: 'int-slack-001',
    name: 'Slack',
    type: 'channel',
    status: 'active',
    icon: '💼',
    description: 'Integrate agents into Slack workspaces for team collaboration and automation.',
    configured: true,
    lastSync: minutesAgo(2),
  },
  {
    id: 'int-claude-001',
    name: 'Claude',
    type: 'model',
    status: 'active',
    icon: '🧠',
    description: 'Anthropic Claude API integration for high-quality conversational AI.',
    configured: true,
    lastSync: minutesAgo(5),
  },
  {
    id: 'int-gpt4-001',
    name: 'GPT-4',
    type: 'model',
    status: 'active',
    icon: '⚡',
    description: 'OpenAI GPT-4 and GPT-4o model integration for advanced reasoning and code generation.',
    configured: true,
    lastSync: minutesAgo(4),
  },
  {
    id: 'int-github-001',
    name: 'GitHub',
    type: 'webhook',
    status: 'active',
    icon: '🐙',
    description: 'GitHub webhook integration for issue tracking, PR reviews, and repository automation.',
    configured: true,
    lastSync: minutesAgo(10),
  },
  {
    id: 'int-webhook-001',
    name: 'Custom Webhook',
    type: 'webhook',
    status: 'inactive',
    icon: '🔗',
    description: 'Generic webhook receiver for custom event-driven integrations and workflows.',
    configured: false,
    lastSync: null,
  },
  {
    id: 'int-s3-001',
    name: 'AWS S3',
    type: 'storage',
    status: 'active',
    icon: '☁️',
    description: 'Amazon S3 integration for persistent file storage, backups, and asset management.',
    configured: true,
    lastSync: hoursAgo(1),
  },
];

const MOCK_TERMINAL_LINES: Omit<TerminalLine, 'id' | 'timestamp'>[] = [
  { type: 'system', content: 'OpenClaw Terminal v1.0.0' },
  { type: 'system', content: 'Initializing runtime environment...' },
  { type: 'output', content: '  ✓ Gateway connected (wss://gateway.openclaw.dev)' },
  { type: 'output', content: '  ✓ 4 MCP servers loaded' },
  { type: 'output', content: '  ✓ 8 plugins initialized' },
  { type: 'output', content: '  ✓ 9 integrations registered' },
  { type: 'output', content: '  ✓ 3 agents online' },
  { type: 'system', content: '' },
  { type: 'output', content: 'Welcome to OpenClaw. Type "help" for available commands.' },
  { type: 'system', content: '' },
];

const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-001',
    name: 'Atlas',
    model: 'claude-3.5-sonnet',
    status: 'active',
    personality: 'Analytical and precise assistant focused on code review, debugging, and system architecture.',
    workspace: '/home/z/workspace/atlas',
    sessions: 142,
  },
  {
    id: 'agent-002',
    name: 'Nova',
    model: 'gpt-4o',
    status: 'busy',
    personality: 'Creative problem-solver with expertise in research, writing, and brainstorming new ideas.',
    workspace: '/home/z/workspace/nova',
    sessions: 87,
  },
  {
    id: 'agent-003',
    name: 'Ember',
    model: 'claude-3-opus',
    status: 'idle',
    personality: 'Friendly and conversational agent designed for customer support and community engagement.',
    workspace: '/home/z/workspace/ember',
    sessions: 213,
  },
];

const MOCK_MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: 'model-claude-35-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    status: 'active',
    apiKeyConfigured: true,
    latency: 320,
    costPerToken: 0.000003,
  },
  {
    id: 'model-claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    status: 'active',
    apiKeyConfigured: true,
    latency: 890,
    costPerToken: 0.000015,
  },
  {
    id: 'model-gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    status: 'active',
    apiKeyConfigured: true,
    latency: 450,
    costPerToken: 0.000005,
  },
  {
    id: 'model-gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    status: 'active',
    apiKeyConfigured: true,
    latency: 180,
    costPerToken: 0.00000015,
  },
  {
    id: 'model-gemini-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    status: 'degraded',
    apiKeyConfigured: true,
    latency: 1200,
    costPerToken: 0.00000125,
  },
  {
    id: 'model-llama-3',
    name: 'Llama 3.1 70B',
    provider: 'Meta (local)',
    status: 'inactive',
    apiKeyConfigured: false,
    latency: null,
    costPerToken: 0,
  },
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useOpenClawStore = create<OpenClawState>((set) => ({
  // ---- Navigation ----
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ---- MCP Servers ----
  mcpServers: MOCK_MCP_SERVERS,
  addMCPServer: (server) =>
    set((s) => ({ mcpServers: [...s.mcpServers, server] })),
  updateMCPServer: (id, updates) =>
    set((s) => ({
      mcpServers: s.mcpServers.map((srv) =>
        srv.id === id ? { ...srv, ...updates } : srv,
      ),
    })),
  removeMCPServer: (id) =>
    set((s) => ({ mcpServers: s.mcpServers.filter((srv) => srv.id !== id) })),
  toggleMCPServer: (id) =>
    set((s) => ({
      mcpServers: s.mcpServers.map((srv) =>
        srv.id === id ? { ...srv, enabled: !srv.enabled } : srv,
      ),
    })),

  // ---- Plugins ----
  plugins: MOCK_PLUGINS,
  addPlugin: (plugin) =>
    set((s) => ({ plugins: [...s.plugins, plugin] })),
  updatePlugin: (id, updates) =>
    set((s) => ({
      plugins: s.plugins.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    })),
  removePlugin: (id) =>
    set((s) => ({ plugins: s.plugins.filter((p) => p.id !== id) })),
  togglePlugin: (id) =>
    set((s) => ({
      plugins: s.plugins.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p,
      ),
    })),

  // ---- Integrations ----
  integrations: MOCK_INTEGRATIONS,
  addIntegration: (integration) =>
    set((s) => ({ integrations: [...s.integrations, integration] })),
  updateIntegration: (id, updates) =>
    set((s) => ({
      integrations: s.integrations.map((i) =>
        i.id === id ? { ...i, ...updates } : i,
      ),
    })),
  removeIntegration: (id) =>
    set((s) => ({
      integrations: s.integrations.filter((i) => i.id !== id),
    })),

  // ---- Terminal ----
  terminal: {
    lines: MOCK_TERMINAL_LINES.map((line, idx) => ({
      ...line,
      id: `term-init-${idx}`,
      timestamp: minutesAgo(1 + idx * 0.1),
    })),
    commandHistory: ['help', 'status', 'list agents', 'mcp restart filesystem'],
    currentDirectory: '/home/z/workspace',
    isConnected: true,
  },
  addTerminalLine: (line) =>
    set((s) => ({
      terminal: {
        ...s.terminal,
        lines: [
          ...s.terminal.lines,
          { ...line, id: uid(), timestamp: isoNow() },
        ],
      },
    })),
  addTerminalLines: (lines) =>
    set((s) => ({
      terminal: {
        ...s.terminal,
        lines: [
          ...s.terminal.lines,
          ...lines.map((l) => ({ ...l, id: uid(), timestamp: isoNow() })),
        ],
      },
    })),
  pushCommandHistory: (command) =>
    set((s) => ({
      terminal: {
        ...s.terminal,
        commandHistory: [...s.terminal.commandHistory, command],
      },
    })),
  setCurrentDirectory: (dir) =>
    set((s) => ({
      terminal: { ...s.terminal, currentDirectory: dir },
    })),
  clearTerminal: () =>
    set((s) => ({
      terminal: {
        ...s.terminal,
        lines: [],
        commandHistory: s.terminal.commandHistory,
      },
    })),
  setTerminalConnected: (connected) =>
    set((s) => ({
      terminal: { ...s.terminal, isConnected: connected },
    })),

  // ---- Agents ----
  agents: MOCK_AGENTS,
  addAgent: (agent) =>
    set((s) => ({ agents: [...s.agents, agent] })),
  updateAgent: (id, updates) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, ...updates } : a,
      ),
    })),
  removeAgent: (id) =>
    set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),

  // ---- Models ----
  modelProviders: MOCK_MODEL_PROVIDERS,
  addModelProvider: (provider) =>
    set((s) => ({ modelProviders: [...s.modelProviders, provider] })),
  updateModelProvider: (id, updates) =>
    set((s) => ({
      modelProviders: s.modelProviders.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
    })),
  removeModelProvider: (id) =>
    set((s) => ({
      modelProviders: s.modelProviders.filter((m) => m.id !== id),
    })),

  // ---- System ----
  system: {
    gatewayStatus: 'online',
    uptime: 86_400, // 24 hours in seconds
    memoryUsage: 47,
    activeConnections: 12,
    notifications: [
      {
        id: 'notif-001',
        type: 'warning',
        title: 'Database MCP Server Error',
        message: 'The PostgreSQL MCP server has been disconnected for 3 hours. Check your database connection.',
        timestamp: hoursAgo(3),
        read: false,
      },
      {
        id: 'notif-002',
        type: 'info',
        title: 'Gemini Pro Degraded',
        message: 'Google Gemini 1.5 Pro is experiencing elevated latency. Some requests may be slower than usual.',
        timestamp: hoursAgo(1),
        read: false,
      },
      {
        id: 'notif-003',
        type: 'success',
        title: 'Agent Nova Active',
        message: 'Agent Nova has picked up a new research task and is currently processing.',
        timestamp: minutesAgo(15),
        read: true,
      },
    ],
  },
  setGatewayStatus: (status) =>
    set((s) => ({ system: { ...s.system, gatewayStatus: status } })),
  setUptime: (uptime) =>
    set((s) => ({ system: { ...s.system, uptime } })),
  setMemoryUsage: (usage) =>
    set((s) => ({ system: { ...s.system, memoryUsage: usage } })),
  setActiveConnections: (count) =>
    set((s) => ({ system: { ...s.system, activeConnections: count } })),
  addNotification: (notification) =>
    set((s) => ({
      system: {
        ...s.system,
        notifications: [
          {
            ...notification,
            id: uid(),
            timestamp: isoNow(),
            read: false,
          },
          ...s.system.notifications,
        ],
      },
    })),
  markNotificationRead: (id) =>
    set((s) => ({
      system: {
        ...s.system,
        notifications: s.system.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
      },
    })),
  dismissNotification: (id) =>
    set((s) => ({
      system: {
        ...s.system,
        notifications: s.system.notifications.filter((n) => n.id !== id),
      },
    })),
}));
