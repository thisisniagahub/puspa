'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Server,
  ArrowRight,
  Terminal,
  Globe,
  Usb,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import {
  useOpenClawStore,
  type MCPServer,
  type MCPServerTransport,
} from '@/store/openclaw-store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function transportBadge(transport: MCPServerTransport) {
  switch (transport) {
    case 'stdio':
      return (
        <Badge variant="outline" className="gap-1 font-mono text-xs">
          <Usb className="size-3" />
          STDIO
        </Badge>
      );
    case 'sse':
      return (
        <Badge variant="outline" className="gap-1 font-mono text-xs">
          <Globe className="size-3" />
          SSE
        </Badge>
      );
    case 'streamable-http':
      return (
        <Badge variant="outline" className="gap-1 font-mono text-xs">
          <Zap className="size-3" />
          Streamable HTTP
        </Badge>
      );
  }
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'connected'
      ? 'bg-emerald-500'
      : status === 'error'
        ? 'bg-red-500'
        : 'bg-zinc-400';

  const animate = status === 'connected';

  return (
    <span className="relative inline-flex size-2.5">
      {animate && (
        <span
          className={`absolute inline-flex size-full animate-ping rounded-full ${color} opacity-40`}
        />
      )}
      <span className={`relative inline-flex size-2.5 rounded-full ${color}`} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Key-Value Row Editor
// ---------------------------------------------------------------------------

function KeyValueRow({
  initialKey = '',
  initialValue = '',
  onChange,
  onRemove,
  showRemove,
}: {
  initialKey?: string;
  initialValue?: string;
  onChange: (key: string, value: string) => void;
  onRemove?: () => void;
  showRemove: boolean;
}) {
  const [key, setKey] = useState(initialKey);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    onChange(key, value);
  }, [key, value]);

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Key"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        className="h-8 flex-1 text-xs"
      />
      <Input
        placeholder="Value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 flex-1 text-xs"
      />
      {showRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------

interface ServerFormData {
  name: string;
  description: string;
  transport: MCPServerTransport;
  command: string;
  args: string;
  url: string;
  headers: { key: string; value: string }[];
  envVars: { key: string; value: string }[];
  enabled: boolean;
}

function emptyForm(): ServerFormData {
  return {
    name: '',
    description: '',
    transport: 'stdio',
    command: '',
    args: '',
    url: '',
    headers: [
      { key: '', value: '' },
      { key: '', value: '' },
    ],
    envVars: [
      { key: '', value: '' },
      { key: '', value: '' },
      { key: '', value: '' },
    ],
    enabled: true,
  };
}

function serverToForm(server: MCPServer): ServerFormData {
  return {
    name: server.name,
    description: server.description,
    transport: server.transport,
    command: server.command ?? '',
    args: server.args?.join(', ') ?? '',
    url: server.url ?? '',
    headers: [
      { key: '', value: '' },
      { key: '', value: '' },
    ],
    envVars: [
      { key: '', value: '' },
      { key: '', value: '' },
      { key: '', value: '' },
    ],
    enabled: server.enabled,
  };
}

// ---------------------------------------------------------------------------
// MCPServersContent
// ---------------------------------------------------------------------------

export function MCPServersContent() {
  const {
    mcpServers,
    addMCPServer,
    updateMCPServer,
    removeMCPServer,
    toggleMCPServer,
  } = useOpenClawStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null);
  const [form, setForm] = useState<ServerFormData>(emptyForm());
  const [testingId, setTestingId] = useState<string | null>(null);

  // --- Dialog handlers ---

  const openAddDialog = useCallback(() => {
    setEditingServer(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((server: MCPServer) => {
    setEditingServer(server);
    setForm(serverToForm(server));
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.name.trim()) {
      toast.error('Server name is required');
      return;
    }

    const parsedArgs = form.args
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    if (editingServer) {
      updateMCPServer(editingServer.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        transport: form.transport,
        command: form.transport === 'stdio' ? form.command.trim() : undefined,
        args: form.transport === 'stdio' ? parsedArgs : undefined,
        url: form.transport !== 'stdio' ? form.url.trim() : undefined,
        enabled: form.enabled,
      });
      toast.success(`Server "${form.name}" updated`);
    } else {
      const newServer: MCPServer = {
        id: uid(),
        name: form.name.trim(),
        description: form.description.trim(),
        transport: form.transport,
        status: 'disconnected',
        command: form.transport === 'stdio' ? form.command.trim() : undefined,
        args: form.transport === 'stdio' ? parsedArgs : undefined,
        url: form.transport !== 'stdio' ? form.url.trim() : undefined,
        tools: [],
        lastConnected: null,
        enabled: form.enabled,
      };
      addMCPServer(newServer);
      toast.success(`Server "${form.name}" added`);
    }

    setDialogOpen(false);
  }, [form, editingServer, addMCPServer, updateMCPServer]);

  const handleDelete = useCallback(
    (server: MCPServer) => {
      removeMCPServer(server.id);
      toast.success(`Server "${server.name}" removed`);
    },
    [removeMCPServer],
  );

  const handleTestConnection = useCallback(
    (server: MCPServer) => {
      setTestingId(server.id);

      // Simulate connection test with a delay
      setTimeout(() => {
        if (server.status === 'error') {
          toast.error(
            `Connection failed for "${server.name}" — check your configuration`,
          );
        } else if (server.status === 'connected') {
          toast.success(`"${server.name}" is connected and responding`);
        } else {
          toast.info(`"${server.name}" is currently disconnected`);
        }
        setTestingId(null);
      }, 1500);
    },
    [],
  );

  // --- Key-value mutators ---

  const updateHeader = useCallback(
    (index: number, key: string, value: string) => {
      setForm((prev) => {
        const next = [...prev.headers];
        next[index] = { key, value };
        return { ...prev, headers: next };
      });
    },
    [],
  );

  const addHeader = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '' }],
    }));
  }, []);

  const removeHeader = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index),
    }));
  }, []);

  const updateEnvVar = useCallback(
    (index: number, key: string, value: string) => {
      setForm((prev) => {
        const next = [...prev.envVars];
        next[index] = { key, value };
        return { ...prev, envVars: next };
      });
    },
    [],
  );

  const addEnvVar = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      envVars: [...prev.envVars, { key: '', value: '' }],
    }));
  }, []);

  const removeEnvVar = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      envVars: prev.envVars.filter((_, i) => i !== index),
    }));
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MCP Servers</h1>
          <p className="text-muted-foreground text-sm">
            Manage Model Context Protocol servers that provide tools to your agents.
          </p>
        </div>
        <Button className="gap-2" onClick={openAddDialog}>
          <Plus className="size-4" />
          Add Server
        </Button>
      </div>

      {/* Server Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {mcpServers.map((server) => (
          <Card key={server.id} className={!server.enabled ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <StatusDot status={server.status} />
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {server.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-1 text-xs">
                      {server.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={server.enabled}
                    onCheckedChange={() => toggleMCPServer(server.id)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Transport + Tools */}
              <div className="flex flex-wrap items-center gap-2">
                {transportBadge(server.transport)}
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Server className="size-3" />
                  {server.tools.length} tool{server.tools.length !== 1 ? 's' : ''}
                </Badge>
                <Badge
                  variant={
                    server.status === 'connected'
                      ? 'default'
                      : server.status === 'error'
                        ? 'destructive'
                        : 'secondary'
                  }
                  className="gap-1 text-xs"
                >
                  {server.status === 'connected' ? (
                    <Wifi className="size-3" />
                  ) : server.status === 'error' ? (
                    <AlertCircle className="size-3" />
                  ) : (
                    <WifiOff className="size-3" />
                  )}
                  {server.status}
                </Badge>
              </div>

              {/* Last Connected */}
              <p className="text-muted-foreground text-xs">
                Last connected: {relativeTime(server.lastConnected)}
              </p>

              <Separator />

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => openEditDialog(server)}
                >
                  <Edit className="size-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={testingId === server.id}
                  onClick={() => handleTestConnection(server)}
                >
                  {testingId === server.id ? (
                    <>
                      <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="size-3" />
                      Test Connection
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs text-destructive hover:text-destructive"
                  onClick={() => handleDelete(server)}
                >
                  <Trash2 className="size-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {mcpServers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="text-muted-foreground mb-3 size-10" />
            <p className="text-muted-foreground text-sm">
              No MCP servers configured yet.
            </p>
            <Button className="mt-4 gap-2" onClick={openAddDialog}>
              <Plus className="size-4" />
              Add Your First Server
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ---- Add / Edit Dialog ---- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingServer ? 'Edit MCP Server' : 'Add MCP Server'}
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              {editingServer
                ? 'Update the configuration for this MCP server.'
                : 'Configure a new MCP server to provide tools to your agents.'}
            </p>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Server Name */}
            <div className="space-y-1.5">
              <Label htmlFor="server-name">Server Name</Label>
              <Input
                id="server-name"
                placeholder="e.g. Filesystem"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="server-desc">Description</Label>
              <Textarea
                id="server-desc"
                placeholder="What does this server do?"
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            {/* Transport Type */}
            <div className="space-y-1.5">
              <Label>Transport Type</Label>
              <Select
                value={form.transport}
                onValueChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    transport: val as MCPServerTransport,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select transport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stdio">
                    <span className="flex items-center gap-2">
                      <Usb className="size-3.5" />
                      STDIO
                    </span>
                  </SelectItem>
                  <SelectItem value="sse">
                    <span className="flex items-center gap-2">
                      <Globe className="size-3.5" />
                      SSE (Server-Sent Events)
                    </span>
                  </SelectItem>
                  <SelectItem value="streamable-http">
                    <span className="flex items-center gap-2">
                      <Zap className="size-3.5" />
                      Streamable HTTP
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* STDIO fields */}
            {form.transport === 'stdio' && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  STDIO Configuration
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="server-command">Command</Label>
                  <Input
                    id="server-command"
                    placeholder="e.g. npx"
                    value={form.command}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        command: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="server-args">
                    Arguments{' '}
                    <span className="text-muted-foreground font-normal">
                      (comma-separated)
                    </span>
                  </Label>
                  <Input
                    id="server-args"
                    placeholder="e.g. -y, @anthropic/mcp-filesystem, /home/z/workspace"
                    value={form.args}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        args: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {/* SSE / Streamable HTTP fields */}
            {form.transport !== 'stdio' && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  {form.transport === 'sse'
                    ? 'SSE Configuration'
                    : 'Streamable HTTP Configuration'}
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="server-url">URL</Label>
                  <Input
                    id="server-url"
                    placeholder="e.g. https://tools.openclaw.dev/mcp/web-search"
                    value={form.url}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        url: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Headers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Headers</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={addHeader}
                    >
                      <Plus className="size-3" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {form.headers.map((h, i) => (
                      <KeyValueRow
                        key={i}
                        initialKey={h.key}
                        initialValue={h.value}
                        onChange={(k, v) => updateHeader(i, k, v)}
                        onRemove={() => removeHeader(i)}
                        showRemove={form.headers.length > 1}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Environment Variables */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Environment Variables</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={addEnvVar}
                >
                  <Plus className="size-3" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {form.envVars.map((env, i) => (
                  <KeyValueRow
                    key={i}
                    initialKey={env.key}
                    initialValue={env.value}
                    onChange={(k, v) => updateEnvVar(i, k, v)}
                    onRemove={() => removeEnvVar(i)}
                    showRemove={form.envVars.length > 1}
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* Enabled Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Enabled</Label>
                <p className="text-muted-foreground text-xs">
                  Enable this server for agent use
                </p>
              </div>
              <Switch
                checked={form.enabled}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="gap-2" onClick={handleSave}>
              <CheckCircle className="size-4" />
              {editingServer ? 'Save Changes' : 'Add Server'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
