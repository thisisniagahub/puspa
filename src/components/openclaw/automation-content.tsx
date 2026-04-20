'use client';

import { useState } from 'react';
import { useOpenClawStore } from '@/store/openclaw-store';
import { cn } from '@/lib/utils';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

import {
  Clock,
  Zap,
  Play,
  Pause,
  Square,
  RotateCcw,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Webhook,
  Timer,
  ListTodo,
  FileText,
  Globe,
  Plus,
  Trash2,
  Settings,
  RefreshCw,
  Activity,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScheduledTask {
  id: string;
  name: string;
  agentId: string;
  agentName: string;
  scheduleType: 'one-time' | 'cron' | 'fixed-rate';
  scheduleExpression: string;
  command: string;
  enabled: boolean;
  nextRun: string;
  lastRun: string | null;
  lastRunStatus: 'success' | 'failed' | null;
}

interface BackgroundTask {
  id: string;
  name: string;
  startedAt: string;
  progress: number; // 0-100
  status: 'running' | 'completed' | 'failed';
  resultSummary: string | null;
  agentName: string;
}

interface StandingOrder {
  id: string;
  trigger: string;
  action: string;
  agentName: string;
  enabled: boolean;
  timesTriggered: number;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  lastTriggered: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_SCHEDULED_TASKS: ScheduledTask[] = [
  {
    id: 'sched-001',
    name: 'Daily Report Generation',
    agentId: 'agent-001',
    agentName: 'Atlas',
    scheduleType: 'cron',
    scheduleExpression: '0 9 * * *',
    command: 'Generate a summary of yesterday\'s activity, pull key metrics from the database, and compile a report for the team.',
    enabled: true,
    nextRun: new Date(Date.now() + 3600_000 * 6).toISOString(),
    lastRun: new Date(Date.now() - 86400_000).toISOString(),
    lastRunStatus: 'success',
  },
  {
    id: 'sched-002',
    name: 'Weekly Code Review Sweep',
    agentId: 'agent-002',
    agentName: 'Nova',
    scheduleType: 'cron',
    scheduleExpression: '0 8 * * 1',
    command: 'Review all open PRs in the main repositories, flag potential issues, and post summaries to #engineering.',
    enabled: true,
    nextRun: new Date(Date.now() + 86400_000 * 3).toISOString(),
    lastRun: new Date(Date.now() - 86400_000 * 4).toISOString(),
    lastRunStatus: 'success',
  },
  {
    id: 'sched-003',
    name: 'Hourly Health Check',
    agentId: 'agent-003',
    agentName: 'Ember',
    scheduleType: 'fixed-rate',
    scheduleExpression: 'Every 60 minutes',
    command: 'Ping all MCP servers, check gateway status, verify agent connectivity, and alert on failures.',
    enabled: true,
    nextRun: new Date(Date.now() + 1800_000).toISOString(),
    lastRun: new Date(Date.now() - 3600_000).toISOString(),
    lastRunStatus: 'success',
  },
  {
    id: 'sched-004',
    name: 'Monthly Data Archive',
    agentId: 'agent-001',
    agentName: 'Atlas',
    scheduleType: 'cron',
    scheduleExpression: '0 2 1 * *',
    command: 'Archive last month\'s logs and conversation data to cold storage on S3.',
    enabled: false,
    nextRun: new Date(Date.now() + 86400_000 * 20).toISOString(),
    lastRun: new Date(Date.now() - 86400_000 * 10).toISOString(),
    lastRunStatus: 'failed',
  },
  {
    id: 'sched-005',
    name: 'One-time Migration',
    agentId: 'agent-002',
    agentName: 'Nova',
    scheduleType: 'one-time',
    scheduleExpression: '2025-02-01T03:00:00Z',
    command: 'Run database schema migration v2.4 and validate all foreign keys.',
    enabled: true,
    nextRun: new Date(Date.now() + 86400_000 * 14).toISOString(),
    lastRun: null,
    lastRunStatus: null,
  },
];

const MOCK_BACKGROUND_TASKS: BackgroundTask[] = [
  {
    id: 'bg-001',
    name: 'Knowledge Base Reindex',
    startedAt: new Date(Date.now() - 1200_000).toISOString(),
    progress: 72,
    status: 'running',
    resultSummary: null,
    agentName: 'Atlas',
  },
  {
    id: 'bg-002',
    name: 'Embedding Generation (Batch #47)',
    startedAt: new Date(Date.now() - 3600_000).toISOString(),
    progress: 100,
    status: 'completed',
    resultSummary: 'Generated 2,847 embeddings across 14 documents in 52 minutes.',
    agentName: 'Nova',
  },
  {
    id: 'bg-003',
    name: 'Repository Scan',
    startedAt: new Date(Date.now() - 600_000).toISOString(),
    progress: 45,
    status: 'running',
    resultSummary: null,
    agentName: 'Atlas',
  },
  {
    id: 'bg-004',
    name: 'Plugin Compatibility Check',
    startedAt: new Date(Date.now() - 7200_000).toISOString(),
    progress: 100,
    status: 'failed',
    resultSummary: 'Timed out while testing BTW Side Questions plugin against Claude 3.5 Sonnet.',
    agentName: 'Ember',
  },
];

const MOCK_STANDING_ORDERS: StandingOrder[] = [
  {
    id: 'so-001',
    trigger: 'New message in #support channel',
    action: 'Summarize the request, check knowledge base for solution, and draft a response for review.',
    agentName: 'Ember',
    enabled: true,
    timesTriggered: 342,
  },
  {
    id: 'so-002',
    trigger: 'New GitHub issue opened',
    action: 'Classify issue type, assign labels, check for duplicates, and add initial triage comment.',
    agentName: 'Nova',
    enabled: true,
    timesTriggered: 89,
  },
  {
    id: 'so-003',
    trigger: 'Daily at midnight UTC',
    action: 'Compile all uncommitted knowledge base entries into a daily digest and post to #team-updates.',
    agentName: 'Atlas',
    enabled: true,
    timesTriggered: 56,
  },
  {
    id: 'so-004',
    trigger: 'Agent error rate exceeds 5%',
    action: 'Send alert to #ops-alerts channel with agent ID, error details, and suggested remediation.',
    agentName: 'Ember',
    enabled: false,
    timesTriggered: 7,
  },
];

const MOCK_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: 'wh-001',
    url: 'https://api.myapp.com/webhooks/openclaw',
    secret: 'whsec_••••••••••••••••',
    events: ['agent.message', 'agent.error', 'task.completed'],
    lastTriggered: new Date(Date.now() - 300_000).toISOString(),
    status: 'active',
    createdAt: new Date(Date.now() - 86400_000 * 10).toISOString(),
  },
  {
    id: 'wh-002',
    url: 'https://hooks.slack.com/services/T00/B00/xxx',
    secret: 'whsec_••••••••••••••••',
    events: ['task.failed', 'system.alert'],
    lastTriggered: new Date(Date.now() - 7200_000).toISOString(),
    status: 'active',
    createdAt: new Date(Date.now() - 86400_000 * 5).toISOString(),
  },
  {
    id: 'wh-003',
    url: 'https://my-ci-cd.example.com/pipeline/trigger',
    secret: 'whsec_••••••••••••••••',
    events: ['deployment.ready'],
    lastTriggered: null,
    status: 'inactive',
    createdAt: new Date(Date.now() - 86400_000 * 2).toISOString(),
  },
];

const ALL_WEBHOOK_EVENTS = [
  { id: 'agent.message', label: 'Agent Message Sent', description: 'Fires when an agent sends a message' },
  { id: 'agent.error', label: 'Agent Error', description: 'Fires when an agent encounters an error' },
  { id: 'task.completed', label: 'Task Completed', description: 'Fires when any task finishes' },
  { id: 'task.failed', label: 'Task Failed', description: 'Fires when a task fails' },
  { id: 'system.alert', label: 'System Alert', description: 'Fires for system-level alerts' },
  { id: 'deployment.ready', label: 'Deployment Ready', description: 'Fires when a deployment is staged' },
  { id: 'model.failover', label: 'Model Failover', description: 'Fires when failover chain activates' },
  { id: 'mcp.server_error', label: 'MCP Server Error', description: 'Fires when an MCP server errors' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function humanReadableSchedule(type: ScheduledTask['scheduleType'], expression: string): string {
  if (type === 'one-time') {
    const d = new Date(expression);
    if (isNaN(d.getTime())) return expression;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  if (type === 'fixed-rate') return expression;

  // Simple cron humanizer
  const parts = expression.split(' ');
  if (parts.length === 5) {
    const [min, hour, dom, mon, dow] = parts;
    if (min === '0' && hour === '9' && dom === '*' && mon === '*' && dow === '*') return 'Every day at 9:00 AM';
    if (min === '0' && hour === '8' && dom === '*' && mon === '*' && dow === '1') return 'Every Monday at 8:00 AM';
    if (min === '0' && hour === '2' && dom === '1' && mon === '*') return '1st of every month at 2:00 AM';
  }
  return expression;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatFutureTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return 'Overdue';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `In ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `In ${hours}h`;
  const days = Math.floor(hours / 24);
  return `In ${days}d`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AutomationContent() {
  const { agents } = useOpenClawStore();

  // Scheduled tasks
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>(MOCK_SCHEDULED_TASKS);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    agentId: '',
    scheduleType: 'cron' as ScheduledTask['scheduleType'],
    scheduleExpression: '',
    command: '',
    enabled: true,
  });

  // Background tasks
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>(MOCK_BACKGROUND_TASKS);

  // Standing orders
  const [standingOrders, setStandingOrders] = useState<StandingOrder[]>(MOCK_STANDING_ORDERS);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({ trigger: '', action: '', agentId: '' });

  // Webhooks
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(MOCK_WEBHOOKS);
  const [createWebhookOpen, setCreateWebhookOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    secret: '',
    selectedEvents: [] as string[],
  });

  // ---- Handlers: Scheduled Tasks ----
  const handleCreateTask = () => {
    const agent = agents.find((a) => a.id === newTask.agentId);
    if (!newTask.name || !newTask.agentId) return;
    const task: ScheduledTask = {
      id: `sched-${Date.now()}`,
      name: newTask.name,
      agentId: newTask.agentId,
      agentName: agent?.name ?? 'Unknown',
      scheduleType: newTask.scheduleType,
      scheduleExpression: newTask.scheduleExpression,
      command: newTask.command,
      enabled: newTask.enabled,
      nextRun: new Date(Date.now() + 3600_000).toISOString(),
      lastRun: null,
      lastRunStatus: null,
    };
    setScheduledTasks((prev) => [...prev, task]);
    setNewTask({ name: '', agentId: '', scheduleType: 'cron', scheduleExpression: '', command: '', enabled: true });
    setCreateTaskOpen(false);
  };

  const handleToggleTask = (id: string) => {
    setScheduledTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)),
    );
  };

  const handleDeleteTask = (id: string) => {
    setScheduledTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // ---- Handlers: Background Tasks ----
  const handleCancelTask = (id: string) => {
    setBackgroundTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'failed' as const, resultSummary: 'Cancelled by user.' } : t)),
    );
  };

  // ---- Handlers: Standing Orders ----
  const handleCreateOrder = () => {
    const agent = agents.find((a) => a.id === newOrder.agentId);
    if (!newOrder.trigger || !newOrder.action) return;
    const order: StandingOrder = {
      id: `so-${Date.now()}`,
      trigger: newOrder.trigger,
      action: newOrder.action,
      agentName: agent?.name ?? 'Unknown',
      enabled: true,
      timesTriggered: 0,
    };
    setStandingOrders((prev) => [...prev, order]);
    setNewOrder({ trigger: '', action: '', agentId: '' });
    setCreateOrderOpen(false);
  };

  const handleToggleOrder = (id: string) => {
    setStandingOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, enabled: !o.enabled } : o)),
    );
  };

  const handleDeleteOrder = (id: string) => {
    setStandingOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // ---- Handlers: Webhooks ----
  const handleCreateWebhook = () => {
    if (!newWebhook.url) return;
    const wh: WebhookEndpoint = {
      id: `wh-${Date.now()}`,
      url: newWebhook.url,
      secret: newWebhook.secret ? 'whsec_••••••••••••••••' : '',
      events: newWebhook.selectedEvents,
      lastTriggered: null,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setWebhooks((prev) => [...prev, wh]);
    setNewWebhook({ url: '', secret: '', selectedEvents: [] });
    setCreateWebhookOpen(false);
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' } : w,
      ),
    );
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  const toggleWebhookEvent = (eventId: string) => {
    setNewWebhook((prev) => ({
      ...prev,
      selectedEvents: prev.selectedEvents.includes(eventId)
        ? prev.selectedEvents.filter((e) => e !== eventId)
        : [...prev.selectedEvents, eventId],
    }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* ================================================================= */}
      {/* Header                                                            */}
      {/* ================================================================= */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Automation</h1>
            <p className="text-sm text-muted-foreground">
              Schedule tasks, manage webhooks, and automate workflows
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Sub-tabs                                                          */}
      {/* ================================================================= */}
      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scheduled" className="gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            Scheduled Tasks
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {scheduledTasks.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="background" className="gap-1.5 text-xs">
            <Activity className="h-3.5 w-3.5" />
            Background Tasks
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {backgroundTasks.filter((t) => t.status === 'running').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="standing" className="gap-1.5 text-xs">
            <ListTodo className="h-3.5 w-3.5" />
            Standing Orders
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {standingOrders.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1.5 text-xs">
            <Webhook className="h-3.5 w-3.5" />
            Webhooks
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {webhooks.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* Scheduled Tasks Tab                                            */}
        {/* ============================================================== */}
        <TabsContent value="scheduled" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {scheduledTasks.filter((t) => t.enabled).length} of {scheduledTasks.length} tasks enabled
            </p>
            <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Create Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Scheduled Task</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label className="text-xs">Task Name</Label>
                    <Input
                      placeholder="e.g. Daily Report Generation"
                      value={newTask.name}
                      onChange={(e) => setNewTask((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Agent</Label>
                    <Select value={newTask.agentId} onValueChange={(v) => setNewTask((p) => ({ ...p, agentId: v }))}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select an agent…" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} ({a.model})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Schedule Type</Label>
                      <Select value={newTask.scheduleType} onValueChange={(v) => setNewTask((p) => ({ ...p, scheduleType: v as ScheduledTask['scheduleType'] }))}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cron">Cron Expression</SelectItem>
                          <SelectItem value="one-time">One-time</SelectItem>
                          <SelectItem value="fixed-rate">Fixed Rate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Schedule Expression</Label>
                      <Input
                        placeholder={
                          newTask.scheduleType === 'cron'
                            ? '0 9 * * *'
                            : newTask.scheduleType === 'one-time'
                              ? '2025-02-01T03:00:00Z'
                              : 'Every 30 minutes'
                        }
                        value={newTask.scheduleExpression}
                        onChange={(e) => setNewTask((p) => ({ ...p, scheduleExpression: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Command / Prompt</Label>
                    <Textarea
                      placeholder="What should the agent do when this task runs?"
                      rows={3}
                      value={newTask.command}
                      onChange={(e) => setNewTask((p) => ({ ...p, command: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="task-enabled"
                      checked={newTask.enabled}
                      onCheckedChange={(v) => setNewTask((p) => ({ ...p, enabled: v }))}
                    />
                    <Label htmlFor="task-enabled" className="text-xs">Enabled</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateTaskOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTask} disabled={!newTask.name || !newTask.agentId}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {scheduledTasks.map((task) => (
              <Card key={task.id} className={cn(!task.enabled && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold truncate">{task.name}</h3>
                        <Badge
                          variant={task.scheduleType === 'one-time' ? 'outline' : 'secondary'}
                          className="text-[10px] shrink-0"
                        >
                          {task.scheduleType === 'one-time' ? (
                            <Timer className="h-2.5 w-2.5 mr-0.5" />
                          ) : (
                            <RotateCcw className="h-2.5 w-2.5 mr-0.5" />
                          )}
                          {task.scheduleType}
                        </Badge>
                        {task.enabled ? (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                            <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            <Pause className="h-2.5 w-2.5 mr-0.5" /> Paused
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {humanReadableSchedule(task.scheduleType, task.scheduleExpression)}
                      </p>

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.command}</p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          Next: <span className="font-medium text-foreground">{formatFutureTime(task.nextRun)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Last: {formatRelativeTime(task.lastRun)}
                          {task.lastRunStatus && (
                            task.lastRunStatus === 'success' ? (
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            )
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Settings className="h-3 w-3" />
                          Agent: <span className="font-medium text-foreground">{task.agentName}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Switch
                        checked={task.enabled}
                        onCheckedChange={() => handleToggleTask(task.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* Background Tasks Tab                                           */}
        {/* ============================================================== */}
        <TabsContent value="background" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {backgroundTasks.filter((t) => t.status === 'running').length} running,
              {' '}
              {backgroundTasks.filter((t) => t.status === 'completed').length} completed,
              {' '}
              {backgroundTasks.filter((t) => t.status === 'failed').length} failed
            </p>
          </div>

          <div className="grid gap-3">
            {backgroundTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{task.name}</h3>
                        {task.status === 'running' && (
                          <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse mr-1" />
                            Running
                          </Badge>
                        )}
                        {task.status === 'completed' && (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                            <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Completed
                          </Badge>
                        )}
                        {task.status === 'failed' && (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertCircle className="h-2.5 w-2.5 mr-0.5" /> Failed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Started {formatRelativeTime(task.startedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Settings className="h-3 w-3" />
                          {task.agentName}
                        </span>
                      </div>
                    </div>

                    {task.status === 'running' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                        onClick={() => handleCancelTask(task.id)}
                      >
                        <Square className="h-3 w-3" />
                        Cancel
                      </Button>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-medium">{task.progress}%</span>
                    </div>
                    <Progress
                      value={task.progress}
                      className={cn(
                        'h-2',
                        task.status === 'failed' && '[&>div]:bg-red-500',
                        task.status === 'completed' && '[&>div]:bg-emerald-500',
                      )}
                    />
                  </div>

                  {task.resultSummary && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                      {task.resultSummary}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* Standing Orders Tab                                            */}
        {/* ============================================================== */}
        <TabsContent value="standing" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Persistent rules that automatically trigger agent actions based on events.
            </p>
            <Dialog open={createOrderOpen} onOpenChange={setCreateOrderOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Standing Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Standing Order</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label className="text-xs">Trigger</Label>
                    <Input
                      placeholder="e.g. When a new message arrives in #support"
                      value={newOrder.trigger}
                      onChange={(e) => setNewOrder((p) => ({ ...p, trigger: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Action</Label>
                    <Textarea
                      placeholder="e.g. Summarize the message and save to wiki"
                      rows={3}
                      value={newOrder.action}
                      onChange={(e) => setNewOrder((p) => ({ ...p, action: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Assigned Agent</Label>
                    <Select value={newOrder.agentId} onValueChange={(v) => setNewOrder((p) => ({ ...p, agentId: v }))}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select an agent…" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} ({a.model})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOrderOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateOrder} disabled={!newOrder.trigger || !newOrder.action}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {standingOrders.map((order) => (
              <Card key={order.id} className={cn(!order.enabled && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                            <Zap className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <span className="text-foreground">{order.trigger}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground">{order.action}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Settings className="h-3 w-3" />
                          Agent: <span className="font-medium text-foreground">{order.agentName}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Triggered {order.timesTriggered} times
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Switch
                        checked={order.enabled}
                        onCheckedChange={() => handleToggleOrder(order.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* Webhooks Tab                                                   */}
        {/* ============================================================== */}
        <TabsContent value="webhooks" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Manage webhook endpoints for event-driven integrations.
            </p>
            <Dialog open={createWebhookOpen} onOpenChange={setCreateWebhookOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Webhook Endpoint</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label className="text-xs">Endpoint URL</Label>
                    <Input
                      placeholder="https://api.example.com/webhooks/openclaw"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook((p) => ({ ...p, url: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Signing Secret (optional)</Label>
                    <Input
                      type="password"
                      placeholder="whsec_..."
                      value={newWebhook.secret}
                      onChange={(e) => setNewWebhook((p) => ({ ...p, secret: e.target.value }))}
                    />
                  </div>

                  <Separator />

                  <div className="grid gap-2">
                    <Label className="text-xs">Events to Subscribe</Label>
                    <div className="grid gap-2 max-h-[240px] overflow-y-auto pr-1">
                      {ALL_WEBHOOK_EVENTS.map((evt) => (
                        <label
                          key={evt.id}
                          className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={newWebhook.selectedEvents.includes(evt.id)}
                            onCheckedChange={() => toggleWebhookEvent(evt.id)}
                            className="mt-0.5"
                          />
                          <div className="grid gap-0.5">
                            <span className="text-xs font-medium">{evt.label}</span>
                            <span className="text-[11px] text-muted-foreground">{evt.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateWebhookOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleCreateWebhook}
                    disabled={!newWebhook.url || newWebhook.selectedEvents.length === 0}
                  >
                    Add Webhook
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {webhooks.map((wh) => (
              <Card key={wh.id} className={cn(wh.status === 'inactive' && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                          <Globe className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-mono font-medium truncate">{wh.url}</span>
                        {wh.status === 'active' ? (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 shrink-0">
                            <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
                            <Pause className="h-2.5 w-2.5 mr-0.5" /> Inactive
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {wh.events.map((evt) => {
                          const evtInfo = ALL_WEBHOOK_EVENTS.find((e) => e.id === evt);
                          return (
                            <Badge key={evt} variant="secondary" className="text-[10px]">
                              {evtInfo?.label ?? evt}
                            </Badge>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Last triggered: {formatRelativeTime(wh.lastTriggered)}
                        </span>
                        <span>Secret: {wh.secret || 'None'}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Switch
                        checked={wh.status === 'active'}
                        onCheckedChange={() => handleToggleWebhook(wh.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteWebhook(wh.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
