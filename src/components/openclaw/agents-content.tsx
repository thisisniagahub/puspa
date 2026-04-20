'use client';

import React, { useState, useMemo } from 'react';
import {
  Bot,
  Plus,
  Settings,
  MessageCircle,
  Brain,
  FileText,
  Folder,
  ArrowRight,
  User,
  Activity,
  Clock,
  Cpu,
  Wrench,
  Globe,
  Zap,
  Edit,
  Eye,
  Play,
  Pause,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useOpenClawStore, type Agent, type AgentStatus } from '@/store/openclaw-store';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENT_AVATAR_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  busy: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  idle: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  offline: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_BADGE_VARIANTS: Record<AgentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  busy: 'secondary',
  idle: 'outline',
  offline: 'outline',
  error: 'destructive',
};

const AVAILABLE_MODELS = [
  { id: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-opus', label: 'Claude 3 Opus' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { id: 'llama-3.1-70b', label: 'Llama 3.1 70B' },
];

const AVAILABLE_SKILLS = [
  'code_review',
  'debugging',
  'web_search',
  'file_management',
  'image_generation',
  'data_analysis',
  'email_composition',
  'summarization',
  'translation',
  'scheduling',
];

const AVAILABLE_CHANNELS = [
  { id: 'discord', label: 'Discord', icon: '💬' },
  { id: 'telegram', label: 'Telegram', icon: '✈️' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '📱' },
  { id: 'slack', label: 'Slack', icon: '💼' },
  { id: 'web', label: 'Web Chat', icon: '🌐' },
  { id: 'api', label: 'REST API', icon: '🔗' },
];

const AVAILABLE_TOOLS = [
  { id: 'apply_patch', label: 'Apply Patch', description: 'Apply code patches to files' },
  { id: 'exec', label: 'Execute Code', description: 'Run commands in sandbox' },
  { id: 'web_browser', label: 'Web Browser', description: 'Headless browser control' },
  { id: 'image_generation', label: 'Image Generation', description: 'Generate images from prompts' },
  { id: 'file_read', label: 'File Read', description: 'Read files from disk' },
  { id: 'file_write', label: 'File Write', description: 'Write files to disk' },
];

const AVAILABLE_MCP_SERVERS = [
  { id: 'mcp-fs-001', label: 'Filesystem' },
  { id: 'mcp-web-001', label: 'Web Search' },
  { id: 'mcp-exec-001', label: 'Code Executor' },
  { id: 'mcp-db-001', label: 'Database' },
];

// ---------------------------------------------------------------------------
// Agent configuration form
// ---------------------------------------------------------------------------

interface AgentFormData {
  name: string;
  model: string;
  personality: string;
  workspace: string;
  systemPrompt: string;
  skills: string[];
  channels: string[];
  tools: string[];
  mcpServers: string[];
}

function defaultFormData(agent: Agent): AgentFormData {
  return {
    name: agent.name,
    model: agent.model,
    personality: agent.personality,
    workspace: agent.workspace,
    systemPrompt: `You are ${agent.name}, a helpful AI assistant powered by OpenClaw.`,
    skills: ['code_review', 'web_search', 'file_management'],
    channels: ['discord', 'web'],
    tools: ['apply_patch', 'exec', 'web_browser', 'file_read', 'file_write'],
    mcpServers: ['mcp-fs-001', 'mcp-web-001'],
  };
}

function AgentConfigSheet({
  agent,
  onSave,
}: {
  agent: Agent;
  onSave: (id: string, updates: Partial<Agent>) => void;
}) {
  const [form, setForm] = useState<AgentFormData>(defaultFormData(agent));
  const [open, setOpen] = useState(false);

  const toggleArrayItem = (key: keyof AgentFormData, item: string) => {
    setForm((prev) => {
      const arr = prev[key] as string[];
      const next = arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
      return { ...prev, [key]: next };
    });
  };

  const handleSave = () => {
    onSave(agent.id, {
      name: form.name,
      model: form.model,
      personality: form.personality,
      workspace: form.workspace,
    });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
          <Settings className="h-3 w-3" />
          Configure
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Configure Agent
          </SheetTitle>
          <SheetDescription>
            Edit {agent.name}&apos;s settings, model, personality, and tool access.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Agent Name */}
          <div className="space-y-2">
            <Label htmlFor="agent-name" className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Agent Name
            </Label>
            <Input
              id="agent-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Enter agent name"
              className="font-mono"
            />
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="agent-model" className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5" />
              Model
            </Label>
            <Select
              value={form.model}
              onValueChange={(v) => setForm((p) => ({ ...p, model: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Personality / SOUL.md */}
          <div className="space-y-2">
            <Label htmlFor="agent-personality" className="flex items-center gap-2">
              <Brain className="h-3.5 w-3.5" />
              Personality / SOUL.md
            </Label>
            <Textarea
              id="agent-personality"
              value={form.personality}
              onChange={(e) => setForm((p) => ({ ...p, personality: e.target.value }))}
              placeholder="Describe the agent's personality..."
              rows={3}
              className="text-sm"
            />
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="agent-system-prompt" className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              System Prompt Template
            </Label>
            <Textarea
              id="agent-system-prompt"
              value={form.systemPrompt}
              onChange={(e) => setForm((p) => ({ ...p, systemPrompt: e.target.value }))}
              placeholder="System prompt template..."
              rows={4}
              className="text-sm font-mono"
            />
          </div>

          {/* Workspace */}
          <div className="space-y-2">
            <Label htmlFor="agent-workspace" className="flex items-center gap-2">
              <Folder className="h-3.5 w-3.5" />
              Workspace Directory
            </Label>
            <Input
              id="agent-workspace"
              value={form.workspace}
              onChange={(e) => setForm((p) => ({ ...p, workspace: e.target.value }))}
              placeholder="/home/z/workspace/agent-name"
              className="font-mono text-sm"
            />
          </div>

          <Separator />

          {/* Skills */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              Skill Allowlist
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_SKILLS.map((skill) => (
                <div key={skill} className="flex items-center gap-2">
                  <Checkbox
                    id={`skill-${skill}`}
                    checked={form.skills.includes(skill)}
                    onCheckedChange={() => toggleArrayItem('skills', skill)}
                  />
                  <Label
                    htmlFor={`skill-${skill}`}
                    className="text-sm font-normal cursor-pointer text-muted-foreground"
                  >
                    {skill.replace(/_/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Channel Bindings */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              Channel Bindings
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_CHANNELS.map((ch) => (
                <div key={ch.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`channel-${ch.id}`}
                    checked={form.channels.includes(ch.id)}
                    onCheckedChange={() => toggleArrayItem('channels', ch.id)}
                  />
                  <Label
                    htmlFor={`channel-${ch.id}`}
                    className="text-sm font-normal cursor-pointer text-muted-foreground"
                  >
                    <span className="mr-1">{ch.icon}</span>
                    {ch.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tools */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5" />
              Tools Configuration
            </Label>
            <div className="space-y-3">
              {AVAILABLE_TOOLS.map((tool) => (
                <div key={tool.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor={`tool-${tool.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tool.label}
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                  <Switch
                    id={`tool-${tool.id}`}
                    checked={form.tools.includes(tool.id)}
                    onCheckedChange={() => toggleArrayItem('tools', tool.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* MCP Servers */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              Per-Agent MCP Servers
            </Label>
            <div className="space-y-2">
              {AVAILABLE_MCP_SERVERS.map((srv) => (
                <div key={srv.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`mcp-${srv.id}`}
                    checked={form.mcpServers.includes(srv.id)}
                    onCheckedChange={() => toggleArrayItem('mcpServers', srv.id)}
                  />
                  <Label
                    htmlFor={`mcp-${srv.id}`}
                    className="text-sm font-normal cursor-pointer text-muted-foreground"
                  >
                    {srv.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Save */}
          <Button className="w-full" onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Agent Card
// ---------------------------------------------------------------------------

function AgentCard({
  agent,
  onConfigure,
}: {
  agent: Agent;
  onConfigure: (id: string, updates: Partial<Agent>) => void;
}) {
  const statusConfig = AGENT_AVATAR_COLORS[agent.status] ?? AGENT_AVATAR_COLORS.idle;
  const badgeVariant = STATUS_BADGE_VARIANTS[agent.status] ?? 'outline';

  return (
    <Card className="bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg font-bold ${statusConfig}`}
            >
              {agent.name.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {agent.name}
                {agent.status === 'active' && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </CardTitle>
              <CardDescription className="text-xs font-mono mt-0.5">
                {agent.model}
              </CardDescription>
            </div>
          </div>
          <Badge variant={badgeVariant} className="text-[10px] uppercase tracking-wider">
            {agent.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Personality */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {agent.personality}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span>{agent.sessions} sessions</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Folder className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="font-mono truncate">{agent.workspace.split('/').pop()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1 border-t border-border/50">
          <AgentConfigSheet agent={agent} onSave={onConfigure} />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
          >
            <Eye className="h-3 w-3" />
            Sessions
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="h-7 w-7">
            {agent.status === 'active' || agent.status === 'busy' ? (
              <Pause className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Play className="h-3.5 w-3.5 text-emerald-500" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Agent Routing Diagram
// ---------------------------------------------------------------------------

function RoutingDiagram() {
  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-primary" />
          Agent Routing Rules
        </CardTitle>
        <CardDescription>
          Configure how messages are routed to different agent instances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Flow diagram */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs overflow-x-auto">
          <div className="flex items-center gap-3 min-w-[500px]">
            {/* Incoming */}
            <div className="flex flex-col items-center gap-1">
              <div className="rounded-md bg-blue-500/20 border border-blue-500/30 px-3 py-2 text-blue-400 text-center">
                <div>Incoming</div>
                <div className="text-[10px] text-blue-400/60">Message</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            {/* Router */}
            <div className="flex flex-col items-center gap-1">
              <div className="rounded-md bg-primary/20 border border-primary/30 px-3 py-2 text-primary text-center">
                <div>OpenClaw</div>
                <div className="text-[10px] text-primary/60">Router</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            {/* Routing logic */}
            <div className="rounded-md bg-amber-500/20 border border-amber-500/30 px-3 py-2 text-amber-400 text-center">
              <div>Route by</div>
              <div className="text-[10px] text-amber-400/60">Channel / User / Intent</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            {/* Agents */}
            <div className="flex gap-2">
              <div className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-2 text-emerald-400 text-center">
                <div>Atlas</div>
                <div className="text-[10px] text-emerald-400/60">Code</div>
              </div>
              <div className="rounded-md bg-violet-500/20 border border-violet-500/30 px-2 py-2 text-violet-400 text-center">
                <div>Nova</div>
                <div className="text-[10px] text-violet-400/60">Research</div>
              </div>
              <div className="rounded-md bg-rose-500/20 border border-rose-500/30 px-2 py-2 text-rose-400 text-center">
                <div>Ember</div>
                <div className="text-[10px] text-rose-400/60">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Example cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageCircle className="h-4 w-4 text-green-500" />
              <span>One Number, Multiple People</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A single WhatsApp number receives messages from many users.
              OpenClaw identifies each sender and routes to the correct agent
              or creates a new session automatically.
            </p>
            <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground/70">
              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-400">+1 User A</span>
              <ArrowRight className="h-3 w-3" />
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">Atlas</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground/70">
              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-400">+1 User B</span>
              <ArrowRight className="h-3 w-3" />
              <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-rose-400">Ember</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4 text-violet-500" />
              <span>Same Channel, Different Agents</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Route messages on the same channel (e.g., Discord) to
              different agents based on intent, topic, or workspace context.
            </p>
            <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground/70">
              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-400">#code-review</span>
              <ArrowRight className="h-3 w-3" />
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">Atlas</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground/70">
              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-400">#brainstorm</span>
              <ArrowRight className="h-3 w-3" />
              <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-violet-400">Nova</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Quick Stats
// ---------------------------------------------------------------------------

function QuickStats() {
  const agents = useOpenClawStore((s) => s.agents);

  const totalAgents = agents.length;
  const totalSessions = agents.reduce((sum, a) => sum + a.sessions, 0);
  const avgResponseTime = 320; // mock

  const stats = [
    {
      label: 'Total Agents',
      value: totalAgents,
      icon: Bot,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Active Sessions',
      value: totalSessions,
      icon: MessageCircle,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Avg Response Time',
      value: `${avgResponseTime}ms`,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Agent Dialog
// ---------------------------------------------------------------------------

function CreateAgentButton() {
  const addAgent = useOpenClawStore((s) => s.addAgent);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    const id = `agent-${Date.now()}`;
    addAgent({
      id,
      name: name.trim(),
      model: 'claude-3.5-sonnet',
      status: 'idle',
      personality: `New agent ${name.trim()} is ready to be configured.`,
      workspace: `/home/z/workspace/${name.trim().toLowerCase().replace(/\s+/g, '-')}`,
      sessions: 0,
    });
    setName('');
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Agent
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            New Agent
          </SheetTitle>
          <SheetDescription>
            Create a new AI agent instance. You can configure it after creation.
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-agent-name">Agent Name</Label>
            <Input
              id="new-agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Phoenix, Oracle, Sage..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
              className="font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The agent will be created with default settings. Open the
            configuration panel to customize model, personality, channels, and
            tools.
          </p>
          <Button className="w-full" onClick={handleCreate} disabled={!name.trim()}>
            Create Agent
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// AgentsContent (main export)
// ---------------------------------------------------------------------------

export function AgentsContent() {
  const agents = useOpenClawStore((s) => s.agents);
  const updateAgent = useOpenClawStore((s) => s.updateAgent);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Agents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure and manage your AI agent instances
          </p>
        </div>
        <CreateAgentButton />
      </div>

      {/* Quick Stats */}
      <QuickStats />

      {/* Active Agents Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Active Agents
          <Badge variant="secondary" className="text-xs">
            {agents.length}
          </Badge>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onConfigure={updateAgent}
            />
          ))}
        </div>
      </div>

      {/* Routing Rules */}
      <RoutingDiagram />
    </div>
  );
}
