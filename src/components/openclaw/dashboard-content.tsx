'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Server,
  PackageOpen,
  Bot,
  Clock,
  Wifi,
  Cpu,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Terminal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useOpenClawStore, type MCPServerStatus } from '@/store/openclaw-store';

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function mcpStatusColor(status: MCPServerStatus): string {
  switch (status) {
    case 'connected':
      return 'text-emerald-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-yellow-500';
  }
}

// ---------------------------------------------------------------------------
// Mock Activity Data
// ---------------------------------------------------------------------------

const MOCK_ACTIVITY = [
  {
    id: 'evt-1',
    icon: <Wifi className="size-4 text-emerald-500" />,
    text: "MCP Server 'web-search' connected",
    time: '2m ago',
  },
  {
    id: 'evt-2',
    icon: <PackageOpen className="size-4 text-blue-500" />,
    text: "Plugin 'voice-call' updated to v2.1.0",
    time: '8m ago',
  },
  {
    id: 'evt-3',
    icon: <Bot className="size-4 text-violet-500" />,
    text: "Agent 'Atlas' completed task",
    time: '15m ago',
  },
  {
    id: 'evt-4',
    icon: <AlertTriangle className="size-4 text-amber-500" />,
    text: 'Model failover triggered: Claude → GPT-4o',
    time: '23m ago',
  },
  {
    id: 'evt-5',
    icon: <Server className="size-4 text-red-500" />,
    text: "MCP Server 'database' connection lost",
    time: '3h ago',
  },
  {
    id: 'evt-6',
    icon: <CheckCircle className="size-4 text-emerald-500" />,
    text: 'System health check passed',
    time: '4h ago',
  },
  {
    id: 'evt-7',
    icon: <Activity className="size-4 text-blue-500" />,
    text: "Integration 'Discord' synced successfully",
    time: '5h ago',
  },
  {
    id: 'evt-8',
    icon: <Cpu className="size-4 text-violet-500" />,
    text: 'Memory usage optimized: 62% → 47%',
    time: '6h ago',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GatewayPulsingDot({ status }: { status: string }) {
  const color =
    status === 'online'
      ? 'bg-emerald-500'
      : status === 'degraded'
        ? 'bg-amber-500'
        : 'bg-red-500';

  const animate =
    status === 'online'
      ? { scale: [1, 1.6, 1], opacity: [0.7, 0.2, 0.7] }
      : status === 'degraded'
        ? { scale: [1, 1.4, 1], opacity: [0.7, 0.3, 0.7] }
        : {};

  return (
    <span className="relative inline-flex size-2.5">
      <span className={`absolute inline-flex size-full rounded-full ${color} opacity-40`} style={
        status === 'online' || status === 'degraded'
          ? { animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite' }
          : {}
      } />
      <span className={`relative inline-flex size-2.5 rounded-full ${color}`} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// DashboardContent
// ---------------------------------------------------------------------------

export function DashboardContent() {
  const {
    mcpServers,
    plugins,
    integrations,
    modelProviders,
    system,
    setActiveTab,
  } = useOpenClawStore();

  // Derived stats
  const connectedServers = mcpServers.filter(
    (s) => s.status === 'connected',
  ).length;
  const serverHasError = mcpServers.some((s) => s.status === 'error');

  const activePlugins = plugins.filter(
    (p) => p.status === 'running' && p.enabled,
  ).length;

  const configuredIntegrations = integrations.filter(
    (i) => i.configured,
  ).length;

  const gatewayStatus = system.gatewayStatus;
  const gatewayLabel =
    gatewayStatus === 'online'
      ? 'Online'
      : gatewayStatus === 'degraded'
        ? 'Degraded'
        : gatewayStatus === 'starting'
          ? 'Starting'
          : 'Offline';

  const gatewayBadgeVariant =
    gatewayStatus === 'online'
      ? 'default'
      : gatewayStatus === 'degraded'
        ? 'secondary'
        : 'destructive';

  return (
    <motion.div
      className="space-y-6 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          System-wide overview of your OpenClaw AI Agent Platform.
        </p>
      </motion.div>

      {/* ---- Stats Grid ---- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* MCP Servers */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <Server className="size-5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground truncate text-xs font-medium">
                  MCP Servers
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold">
                    {mcpServers.length}
                  </span>
                  <span
                    className={`text-xs font-semibold ${mcpStatusColor(serverHasError ? 'error' : 'connected')}`}
                  >
                    {connectedServers} up
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <ArrowUpRight className="size-3.5 text-emerald-500" />
                <span className="text-emerald-500 text-xs">+1</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Plugins */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                <PackageOpen className="size-5 text-violet-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground truncate text-xs font-medium">
                  Active Plugins
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold">{activePlugins}</span>
                  <span className="text-muted-foreground text-xs">
                    / {plugins.length}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <TrendingUp className="size-3.5 text-emerald-500" />
                <span className="text-emerald-500 text-xs">+12%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Integrations */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Activity className="size-5 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground truncate text-xs font-medium">
                  Integrations
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold">
                    {configuredIntegrations}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    / {integrations.length}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <ArrowUpRight className="size-3.5 text-emerald-500" />
                <span className="text-emerald-500 text-xs">+2</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Uptime */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Clock className="size-5 text-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground truncate text-xs font-medium">
                  System Uptime
                </p>
                <span className="text-xl font-bold">
                  {formatUptime(system.uptime)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <CheckCircle className="size-3.5 text-emerald-500" />
                <span className="text-emerald-500 text-xs">99.9%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ---- Main Grid: Gateway Status + Activity Feed ---- */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Gateway Status Card */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wifi className="size-4" />
                  Gateway Status
                </CardTitle>
                <Badge variant={gatewayBadgeVariant} className="gap-1.5">
                  <GatewayPulsingDot status={gatewayStatus} />
                  {gatewayLabel}
                </Badge>
              </div>
              <CardDescription>
                Core gateway managing agent communications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Uptime */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Uptime</span>
                <span className="text-sm font-medium">
                  {formatUptime(system.uptime)}
                </span>
              </div>

              {/* Memory Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Memory Usage
                  </span>
                  <span className="text-sm font-medium">
                    {system.memoryUsage}%
                  </span>
                </div>
                <Progress value={system.memoryUsage} />
              </div>

              {/* Active Connections */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Active Connections
                </span>
                <span className="text-sm font-medium">
                  {system.activeConnections}
                </span>
              </div>

              {/* Protocol */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Protocol
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  WebSocket (WSS)
                </Badge>
              </div>

              {/* Unread Notifications */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Notifications
                </span>
                <span className="text-sm font-medium">
                  {system.notifications.filter((n) => !n.read).length} unread
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="size-4" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest events across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {/* Timeline line */}
                <div className="bg-border absolute left-[15px] top-2 bottom-2 w-px" />

                {MOCK_ACTIVITY.map((event) => (
                  <div
                    key={event.id}
                    className="relative flex items-start gap-3 py-2.5"
                  >
                    <div className="relative z-10 flex size-[30px] shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
                      {event.icon}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm leading-snug">{event.text}</p>
                      <p className="text-muted-foreground text-xs">
                        {event.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ---- Quick Actions ---- */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get started quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setActiveTab('mcp-servers')}
              >
                <Server className="size-4" />
                Add MCP Server
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setActiveTab('plugins')}
              >
                <PackageOpen className="size-4" />
                Install Plugin
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setActiveTab('agents')}
              >
                <Bot className="size-4" />
                New Agent
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setActiveTab('terminal')}
              >
                <Terminal className="size-4" />
                Open Terminal
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- Model Health Overview ---- */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="size-4" />
              Model Health
            </CardTitle>
            <CardDescription>
              Status and latency for configured model providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modelProviders.map((model) => {
                const dotColor =
                  model.status === 'active'
                    ? 'bg-emerald-500'
                    : model.status === 'degraded'
                      ? 'bg-amber-500'
                      : model.status === 'error'
                        ? 'bg-red-500'
                        : 'bg-zinc-400';

                return (
                  <div
                    key={model.id}
                    className="border-border/60 flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`inline-block size-2 shrink-0 rounded-full ${dotColor}`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {model.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {model.provider}
                        </p>
                      </div>
                    </div>
                    {model.latency !== null ? (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {model.latency}ms
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        N/A
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
