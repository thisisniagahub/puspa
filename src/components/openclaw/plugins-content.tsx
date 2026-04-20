'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Settings,
  Trash2,
  Package,
  Puzzle,
  Download,
  Search,
  Check,
  X,
  Wrench,
  Zap,
  Code,
  MessageSquare,
  Globe,
  Mic,
  Brain,
  Image,
  FileText,
  Shield,
  Radio,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  useOpenClawStore,
  type Plugin,
  type PluginCategory,
  type PluginSource,
  type PluginStatus,
} from '@/store/openclaw-store';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type FilterChip = 'all' | 'native' | 'codex' | 'claude' | 'cursor' | 'bundles';

const FILTER_CHIPS: { value: FilterChip; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'native', label: 'Native' },
  { value: 'codex', label: 'Codex' },
  { value: 'claude', label: 'Claude' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'bundles', label: 'Bundles' },
];

const CATEGORY_ICON: Record<PluginCategory, React.ElementType> = {
  communication: MessageSquare,
  productivity: FileText,
  ai: Brain,
  integration: Globe,
  media: Image,
  utilities: Wrench,
};

const SOURCE_STYLES: Record<PluginSource, string> = {
  openclaw: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  codex: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  claude: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  cursor: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
};

const STATUS_STYLES: Record<PluginStatus, string> = {
  running: 'bg-emerald-500',
  installed: 'bg-blue-500',
  stopped: 'bg-gray-400',
  error: 'bg-red-500',
};

const STATUS_LABELS: Record<PluginStatus, string> = {
  running: 'Running',
  installed: 'Installed',
  stopped: 'Stopped',
  error: 'Error',
};

const MARKETPLACE_PLUGINS = [
  { name: 'Email Automation', author: 'OpenClaw Team', version: '1.8.0', description: 'Send and receive emails with templating and scheduling support.', downloads: '12.4k', source: 'openclaw' as PluginSource },
  { name: 'Calendar Sync', author: 'OpenClaw Team', version: '2.0.1', description: 'Sync with Google Calendar and Outlook for meeting management.', downloads: '8.7k', source: 'openclaw' as PluginSource },
  { name: 'Code Reviewer', author: 'Claude Extensions', version: '1.3.2', description: 'Automated code review with PR analysis and suggestion generation.', downloads: '15.2k', source: 'claude' as PluginSource },
  { name: 'Data Pipeline', author: 'Cursor Labs', version: '0.5.0', description: 'ETL-style data transformation and pipeline orchestration.', downloads: '3.1k', source: 'cursor' as PluginSource },
  { name: 'Sentiment Analyzer', author: 'OpenAI', version: '1.1.0', description: 'Real-time text sentiment analysis for customer feedback.', downloads: '6.9k', source: 'codex' as PluginSource },
  { name: 'SSH Tunnel', author: 'OpenClaw Team', version: '1.0.3', description: 'Secure tunnel management for remote server access.', downloads: '4.5k', source: 'openclaw' as PluginSource },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PluginCard({
  plugin,
  onToggle,
  onRemove,
  onConfigure,
}: {
  plugin: Plugin;
  onToggle: () => void;
  onRemove: () => void;
  onConfigure: () => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const CategoryIcon = CATEGORY_ICON[plugin.category] || Puzzle;

  return (
    <Card className="group relative transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-4">
        {/* Top row: icon, name, version, source */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              plugin.enabled
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <CategoryIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{plugin.name}</h3>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                v{plugin.version}
              </Badge>
              <Badge
                variant="outline"
                className={cn('text-[10px] px-1.5 py-0 font-normal capitalize', SOURCE_STYLES[plugin.source])}
              >
                {plugin.source}
              </Badge>
            </div>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-1 capitalize">
              {plugin.category}
            </Badge>
          </div>

          {/* Status dot */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn('inline-block h-2 w-2 rounded-full', STATUS_STYLES[plugin.status])} />
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              {STATUS_LABELS[plugin.status]}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {plugin.description}
        </p>

        <Separator className="my-3" />

        {/* Bottom row: author, toggle, actions */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground truncate">
            by {plugin.author} · {timeAgo(plugin.installedAt)}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <Switch
                checked={plugin.enabled}
                onCheckedChange={onToggle}
                className="scale-75"
              />
              <span className="text-[10px] text-muted-foreground">
                {plugin.enabled ? 'On' : 'Off'}
              </span>
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onConfigure}>
              <Settings className="h-3.5 w-3.5" />
            </Button>
            {confirmRemove ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 px-2 text-[10px]"
                  onClick={() => {
                    onRemove();
                    setConfirmRemove(false);
                  }}
                >
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setConfirmRemove(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InstallPluginDialog() {
  const { addPlugin } = useOpenClawStore();
  const [open, setOpen] = useState(false);
  const [installMethod, setInstallMethod] = useState<'directory' | 'url' | 'marketplace'>('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryPath, setDirectoryPath] = useState('');
  const [archiveUrl, setArchiveUrl] = useState('');

  const filteredMarketplace = useMemo(() => {
    if (!searchQuery.trim()) return MARKETPLACE_PLUGINS;
    const q = searchQuery.toLowerCase();
    return MARKETPLACE_PLUGINS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  function handleInstall(plugin: typeof MARKETPLACE_PLUGINS[number]) {
    const newPlugin: Plugin = {
      id: `plug-${plugin.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: plugin.name,
      version: plugin.version,
      status: 'installed',
      source: plugin.source,
      category: 'utilities',
      description: plugin.description,
      author: plugin.author,
      enabled: true,
      installedAt: new Date().toISOString(),
    };
    addPlugin(newPlugin);
    setOpen(false);
    setSearchQuery('');
    setDirectoryPath('');
    setArchiveUrl('');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Install Plugin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-orange-500" />
            Install Plugin
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Install method selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Install from</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'directory' as const, label: 'Directory', icon: Package },
                { value: 'url' as const, label: 'Archive URL', icon: Globe },
                { value: 'marketplace' as const, label: 'Marketplace', icon: Search },
              ].map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.value}
                    onClick={() => setInstallMethod(method.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors',
                      installMethod === method.value
                        ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                        : 'border-border hover:bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {method.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Directory path input */}
          {installMethod === 'directory' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Plugin Directory Path</label>
              <Input
                placeholder="/path/to/plugin"
                value={directoryPath}
                onChange={(e) => setDirectoryPath(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Enter the absolute path to the plugin directory on your system.
              </p>
              <DialogFooter>
                <Button
                  disabled={!directoryPath.trim()}
                  onClick={() => {
                    handleInstall({
                      name: directoryPath.split('/').pop() || 'Custom Plugin',
                      author: 'Local',
                      version: '0.0.1',
                      description: `Custom plugin from ${directoryPath}`,
                      downloads: '—',
                      source: 'openclaw',
                    });
                  }}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Install from Directory
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Archive URL input */}
          {installMethod === 'url' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Archive URL</label>
              <Input
                placeholder="https://example.com/plugin.tar.gz"
                value={archiveUrl}
                onChange={(e) => setArchiveUrl(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Paste a URL to a .tar.gz or .zip plugin archive.
              </p>
              <DialogFooter>
                <Button
                  disabled={!archiveUrl.trim()}
                  onClick={() => {
                    handleInstall({
                      name: 'Remote Plugin',
                      author: 'Remote',
                      version: '0.0.1',
                      description: `Plugin from ${archiveUrl}`,
                      downloads: '—',
                      source: 'openclaw',
                    });
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download & Install
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Marketplace search */}
          {installMethod === 'marketplace' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search plugins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {filteredMarketplace.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Puzzle className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No plugins found</p>
                  </div>
                ) : (
                  filteredMarketplace.map((plugin) => (
                    <div
                      key={plugin.name}
                      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{plugin.name}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                            v{plugin.version}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5 py-0 font-normal capitalize', SOURCE_STYLES[plugin.source])}
                          >
                            {plugin.source}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {plugin.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {plugin.author}
                          </span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">
                            <Download className="h-3 w-3 inline mr-0.5" />
                            {plugin.downloads}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" className="h-7 text-xs shrink-0" onClick={() => handleInstall(plugin)}>
                        Install
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfigurePluginSheet({
  plugin,
  open,
  onOpenChange,
}: {
  plugin: Plugin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updatePlugin } = useOpenClawStore();
  const [configName, setConfigName] = useState(plugin.name);
  const [logLevel, setLogLevel] = useState('info');
  const [autoStart, setAutoStart] = useState(true);
  const [maxMemory, setMaxMemory] = useState('256');

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-end',
        !open && 'pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={() => onOpenChange(false)}
      />
      {/* Sheet */}
      <div
        className={cn(
          'relative w-full max-w-md bg-background border-l shadow-xl transition-transform duration-200 overflow-y-auto',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-500" />
              Configure
            </h2>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Plugin info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Badge className={cn('text-[10px] px-1.5 py-0 font-normal capitalize', SOURCE_STYLES[plugin.source])}>
              {plugin.source}
            </Badge>
            <span className="text-sm font-medium">{plugin.name}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">
              v{plugin.version}
            </Badge>
          </div>

          {/* Config fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plugin Name</label>
              <Input value={configName} onChange={(e) => setConfigName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Log Level</label>
              <Select value={logLevel} onValueChange={setLogLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Memory (MB)</label>
              <Input type="number" value={maxMemory} onChange={(e) => setMaxMemory(e.target.value)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Auto Start</label>
                <p className="text-[11px] text-muted-foreground">Start automatically on gateway boot</p>
              </div>
              <Switch checked={autoStart} onCheckedChange={setAutoStart} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Enabled</label>
                <p className="text-[11px] text-muted-foreground">Plugin is active and processing events</p>
              </div>
              <Switch
                checked={plugin.enabled}
                onCheckedChange={(checked) => {
                  updatePlugin(plugin.id, { enabled: checked });
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                useOpenClawStore.getState().removePlugin(plugin.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PluginsContent() {
  const { plugins, togglePlugin, removePlugin } = useOpenClawStore();
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const [configurePlugin, setConfigurePlugin] = useState<Plugin | null>(null);

  // Filter plugins based on active chip
  const filteredPlugins = useMemo(() => {
    return plugins.filter((plugin) => {
      switch (activeFilter) {
        case 'all':
          return true;
        case 'native':
          return plugin.source === 'openclaw';
        case 'codex':
          return plugin.source === 'codex';
        case 'claude':
          return plugin.source === 'claude';
        case 'cursor':
          return plugin.source === 'cursor';
        case 'bundles':
          // For bundles, we treat all as potential bundle members (mock)
          return true;
        default:
          return true;
      }
    });
  }, [plugins, activeFilter]);

  // Stats
  const totalPlugins = plugins.length;
  const runningPlugins = plugins.filter((p) => p.status === 'running').length;
  const bundleCount = Math.floor(totalPlugins / 3); // mock: ~1/3 from bundles

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Puzzle className="h-6 w-6 text-orange-500" />
            Plugins &amp; Skills
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage OpenClaw plugins, bundles, and skills
          </p>
        </div>
        <InstallPluginDialog />
      </div>

      {/* ═══ Stats Bar ═══ */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" />
          <strong className="text-foreground">{totalPlugins}</strong> plugins installed
        </span>
        <span className="text-border">•</span>
        <span className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-emerald-500" />
          <strong className="text-foreground">{runningPlugins}</strong> running
        </span>
        <span className="text-border">•</span>
        <span className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-orange-500" />
          <strong className="text-foreground">{bundleCount}</strong> from bundles
        </span>
      </div>

      {/* ═══ Filter Chips ═══ */}
      <div className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setActiveFilter(chip.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
              activeFilter === chip.value
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ═══ Plugin Grid ═══ */}
      {filteredPlugins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium">No plugins found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {activeFilter === 'all'
              ? 'Install your first plugin to get started.'
              : `No plugins matching "${FILTER_CHIPS.find((c) => c.value === activeFilter)?.label}" filter.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPlugins.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              onToggle={() => togglePlugin(plugin.id)}
              onRemove={() => removePlugin(plugin.id)}
              onConfigure={() => setConfigurePlugin(plugin)}
            />
          ))}
        </div>
      )}

      {/* ═══ Configure Sheet ═══ */}
      {configurePlugin && (
        <ConfigurePluginSheet
          plugin={configurePlugin}
          open={!!configurePlugin}
          onOpenChange={(open) => {
            if (!open) setConfigurePlugin(null);
          }}
        />
      )}
    </div>
  );
}
