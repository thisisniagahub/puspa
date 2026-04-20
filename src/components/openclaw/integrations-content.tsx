'use client';

import { useState, useMemo } from 'react';
import {
  Link2,
  MessageCircle,
  Bot,
  Webhook,
  Database,
  Github,
  CheckCircle,
  XCircle,
  Settings,
  ChevronRight,
  Zap,
  Shield,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  useOpenClawStore,
  type Integration,
  type IntegrationType,
} from '@/store/openclaw-store';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------

type CategoryKey = 'channels' | 'models' | 'webhooks' | 'storage';

interface IntegrationTemplate {
  id: string;
  name: string;
  type: IntegrationType;
  icon: string;
  color: string;
  description: string;
  configFields: ConfigField[];
}

interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
}

const CATEGORY_META: Record<CategoryKey, { label: string; icon: React.ElementType }> = {
  channels: { label: 'Chat Channels', icon: MessageCircle },
  models: { label: 'Model Providers', icon: Bot },
  webhooks: { label: 'Webhooks & Services', icon: Webhook },
  storage: { label: 'Storage', icon: Database },
};

const TYPE_STYLES: Record<IntegrationType, string> = {
  channel: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  model: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  webhook: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  storage: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
};

// Full template list (includes all integrations, configured or not)
const INTEGRATION_TEMPLATES: IntegrationTemplate[] = [
  // Chat Channels
  {
    id: 'int-discord-001',
    name: 'Discord',
    type: 'channel',
    icon: '💬',
    color: '#5865F2',
    description: 'Connect your agent to Discord servers for automated responses and community management.',
    configFields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: 'Enter Discord bot token' },
      { key: 'serverId', label: 'Server ID', type: 'text', placeholder: 'Enter server ID' },
      { key: 'channelId', label: 'Default Channel ID', type: 'text', placeholder: 'Enter channel ID' },
    ],
  },
  {
    id: 'int-telegram-001',
    name: 'Telegram',
    type: 'channel',
    icon: '✈️',
    color: '#26A5E4',
    description: 'Deploy agents as Telegram bots for one-on-one and group conversations.',
    configFields: [
      { key: 'apiToken', label: 'API Token', type: 'password', placeholder: 'Enter Telegram bot token' },
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://yourdomain.com/webhook/telegram' },
    ],
  },
  {
    id: 'int-whatsapp-001',
    name: 'WhatsApp',
    type: 'channel',
    icon: '📱',
    color: '#25D366',
    description: 'WhatsApp Business API integration for customer support and notifications.',
    configFields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', placeholder: 'Enter phone number ID' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Enter access token' },
      { key: 'webhookVerifyToken', label: 'Webhook Verify Token', type: 'text', placeholder: 'Enter verify token' },
    ],
  },
  {
    id: 'int-slack-001',
    name: 'Slack',
    type: 'channel',
    icon: '💼',
    color: '#4A154B',
    description: 'Integrate agents into Slack workspaces for team collaboration and automation.',
    configFields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...' },
      { key: 'appToken', label: 'App-Level Token', type: 'password', placeholder: 'xapp-...' },
      { key: 'signingSecret', label: 'Signing Secret', type: 'password', placeholder: 'Enter signing secret' },
    ],
  },
  {
    id: 'int-teams-001',
    name: 'Microsoft Teams',
    type: 'channel',
    icon: '🟦',
    color: '#6264A7',
    description: 'Connect agents to Microsoft Teams for enterprise collaboration workflows.',
    configFields: [
      { key: 'appId', label: 'App ID', type: 'text', placeholder: 'Enter Microsoft App ID' },
      { key: 'appPassword', label: 'App Password', type: 'password', placeholder: 'Enter app password' },
    ],
  },
  {
    id: 'int-line-001',
    name: 'LINE',
    type: 'channel',
    icon: '🟢',
    color: '#00B900',
    description: 'LINE Messaging API integration for Japanese and Southeast Asian markets.',
    configFields: [
      { key: 'channelToken', label: 'Channel Access Token', type: 'password', placeholder: 'Enter LINE channel token' },
      { key: 'channelSecret', label: 'Channel Secret', type: 'password', placeholder: 'Enter channel secret' },
    ],
  },
  {
    id: 'int-signal-001',
    name: 'Signal',
    type: 'channel',
    icon: '🔒',
    color: '#3A76F0',
    description: 'End-to-end encrypted messaging integration via Signal bridge.',
    configFields: [
      { key: 'phoneNumber', label: 'Phone Number', type: 'text', placeholder: '+1234567890' },
      { key: 'bridgeUrl', label: 'Signal Bridge URL', type: 'url', placeholder: 'http://localhost:8080' },
    ],
  },
  {
    id: 'int-irc-001',
    name: 'IRC',
    type: 'channel',
    icon: '🖥️',
    color: '#6B7280',
    description: 'Classic IRC channel integration for community chat and bot interactions.',
    configFields: [
      { key: 'server', label: 'IRC Server', type: 'text', placeholder: 'irc.libera.chat' },
      { key: 'channel', label: 'Channel', type: 'text', placeholder: '#mychannel' },
      { key: 'nick', label: 'Nickname', type: 'text', placeholder: 'Enter bot nickname' },
    ],
  },

  // Model Providers
  {
    id: 'int-claude-001',
    name: 'Claude',
    type: 'model',
    icon: '🧠',
    color: '#D97757',
    description: 'Anthropic Claude API integration for high-quality conversational AI.',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-ant-...' },
      { key: 'model', label: 'Default Model', type: 'text', placeholder: 'claude-3.5-sonnet' },
    ],
  },
  {
    id: 'int-gpt4-001',
    name: 'GPT-4',
    type: 'model',
    icon: '⚡',
    color: '#10A37F',
    description: 'OpenAI GPT-4 and GPT-4o model integration for advanced reasoning and code generation.',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...' },
      { key: 'orgId', label: 'Organization ID', type: 'text', placeholder: 'org-...' },
    ],
  },
  {
    id: 'int-gemini-001',
    name: 'Google Gemini',
    type: 'model',
    icon: '💎',
    color: '#4285F4',
    description: 'Google Gemini API integration for multimodal AI capabilities.',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter Google AI API key' },
    ],
  },
  {
    id: 'int-groq-001',
    name: 'Groq',
    type: 'model',
    icon: '🚀',
    color: '#F55036',
    description: 'Ultra-fast inference with Groq LPU technology for real-time applications.',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'gsk_...' },
    ],
  },
  {
    id: 'int-openrouter-001',
    name: 'OpenRouter',
    type: 'model',
    icon: '🔀',
    color: '#6366F1',
    description: 'Unified API gateway for accessing multiple LLM providers through a single endpoint.',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-or-...' },
      { key: 'siteUrl', label: 'Site URL', type: 'url', placeholder: 'https://yourdomain.com' },
    ],
  },

  // Webhooks
  {
    id: 'int-webhook-relay-001',
    name: 'Webhook Relay',
    type: 'webhook',
    icon: '🔗',
    color: '#F59E0B',
    description: 'Managed webhook relay service for reliable event forwarding to OpenClaw agents.',
    configFields: [
      { key: 'relayUrl', label: 'Relay URL', type: 'url', placeholder: 'https://relay.openclaw.dev/...' },
      { key: 'secret', label: 'Signing Secret', type: 'password', placeholder: 'Enter signing secret' },
    ],
  },
  {
    id: 'int-webhook-001',
    name: 'Custom Webhook',
    type: 'webhook',
    icon: '🌐',
    color: '#8B5CF6',
    description: 'Generic webhook receiver for custom event-driven integrations and workflows.',
    configFields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://yourdomain.com/webhook' },
      { key: 'secret', label: 'Secret (optional)', type: 'password', placeholder: 'Enter webhook secret' },
    ],
  },

  // Storage
  {
    id: 'int-s3-001',
    name: 'AWS S3',
    type: 'storage',
    icon: '☁️',
    color: '#FF9900',
    description: 'Amazon S3 integration for persistent file storage, backups, and asset management.',
    configFields: [
      { key: 'accessKeyId', label: 'Access Key ID', type: 'password', placeholder: 'AKIA...' },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', placeholder: 'Enter secret access key' },
      { key: 'bucket', label: 'Bucket Name', type: 'text', placeholder: 'my-openclaw-bucket' },
      { key: 'region', label: 'Region', type: 'text', placeholder: 'us-east-1' },
    ],
  },
  {
    id: 'int-memory-wiki-001',
    name: 'Memory Wiki',
    type: 'storage',
    icon: '📖',
    color: '#06B6D4',
    description: 'Persistent knowledge graph and wiki-style memory for agent knowledge retention.',
    configFields: [
      { key: 'storagePath', label: 'Storage Path', type: 'text', placeholder: '/data/memory-wiki' },
    ],
  },
  {
    id: 'int-file-storage-001',
    name: 'File Storage',
    type: 'storage',
    icon: '📁',
    color: '#10B981',
    description: 'Local file system storage for agent documents, uploads, and generated content.',
    configFields: [
      { key: 'basePath', label: 'Base Path', type: 'text', placeholder: '/data/files' },
      { key: 'maxFileSize', label: 'Max File Size (MB)', type: 'text', placeholder: '100' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function categoryFromType(type: IntegrationType): CategoryKey {
  switch (type) {
    case 'channel':
      return 'channels';
    case 'model':
      return 'models';
    case 'webhook':
      return 'webhooks';
    case 'storage':
      return 'storage';
  }
}

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

function IntegrationCard({
  template,
  integration,
  onConfigure,
  onConnect,
}: {
  template: IntegrationTemplate;
  integration: Integration | undefined;
  onConfigure: () => void;
  onConnect: () => void;
}) {
  const configured = integration?.configured ?? false;

  return (
    <Card className="group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: `${template.color}18` }}
          >
            {template.icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{template.name}</h3>
              <Badge
                variant="outline"
                className={cn('text-[10px] px-1.5 py-0 font-normal capitalize', TYPE_STYLES[template.type])}
              >
                {template.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
              {template.description}
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 shrink-0">
            {configured ? (
              <>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-[10px] text-emerald-600 font-medium hidden sm:inline">
                  Configured
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-muted-foreground/50" />
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  Not set up
                </span>
              </>
            )}
          </div>
        </div>

        {/* Last sync */}
        {configured && integration?.lastSync && (
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            Last synced {timeAgo(integration.lastSync)}
          </div>
        )}

        <Separator className="my-3" />

        {/* Action */}
        <div className="flex items-center justify-between">
          {configured ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={onConfigure}>
                <Settings className="h-3 w-3" />
                Configure
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                <ExternalLink className="h-3 w-3" />
                Dashboard
              </Button>
            </div>
          ) : (
            <Button size="sm" className="h-8 text-xs gap-1" onClick={onConnect}>
              <Link2 className="h-3 w-3" />
              Connect
            </Button>
          )}

          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfigureIntegrationSheet({
  template,
  integration,
  open,
  onOpenChange,
}: {
  template: IntegrationTemplate;
  integration: Integration | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addIntegration, updateIntegration, removeIntegration } = useOpenClawStore();
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    // Pre-fill with mock values for configured integrations
    const values: Record<string, string> = {};
    template.configFields.forEach((field) => {
      values[field.key] = '';
    });
    return values;
  });
  const [enabled, setEnabled] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    // Simulate connection test
    setTimeout(() => {
      setTesting(false);
      setTestResult(Math.random() > 0.2 ? 'success' : 'error');
    }, 1500);
  }

  function handleSave() {
    if (integration) {
      // Update existing
      updateIntegration(integration.id, {
        configured: true,
        status: enabled ? 'active' : 'inactive',
        lastSync: new Date().toISOString(),
      });
    } else {
      // Create new
      const newIntegration: Integration = {
        id: template.id,
        name: template.name,
        type: template.type,
        status: enabled ? 'active' : 'inactive',
        icon: template.icon,
        description: template.description,
        configured: true,
        lastSync: new Date().toISOString(),
      };
      addIntegration(newIntegration);
    }
    onOpenChange(false);
  }

  function handleDisconnect() {
    if (integration) {
      updateIntegration(integration.id, {
        configured: false,
        status: 'inactive',
      });
    }
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
              style={{ backgroundColor: `${template.color}18` }}
            >
              {template.icon}
            </div>
            {integration ? 'Configure' : 'Connect'} {template.name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Integration info */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Badge
              variant="outline"
              className={cn('text-[10px] px-1.5 py-0 font-normal capitalize', TYPE_STYLES[template.type])}
            >
              {template.type}
            </Badge>
            <span className="text-xs text-muted-foreground">{template.name}</span>
            {integration?.configured && (
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 ml-auto" />
            )}
          </div>

          <p className="text-sm text-muted-foreground">{template.description}</p>

          <Separator />

          {/* Configuration fields */}
          <div className="space-y-4">
            {template.configFields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key} className="text-sm font-medium">
                  {field.label}
                </Label>
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formValues[field.key] || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                />
              </div>
            ))}

            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Enabled</Label>
                <p className="text-[11px] text-muted-foreground">
                  {enabled ? 'Integration is active' : 'Integration is paused'}
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>

          <Separator />

          {/* Test Connection */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleTestConnection}
              disabled={testing}
            >
              <RefreshCw className={cn('h-4 w-4', testing && 'animate-spin')} />
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>

            {testResult && (
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg p-3 text-sm',
                  testResult === 'success'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                )}
              >
                {testResult === 'success' ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Connection successful!
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Connection failed. Check your credentials.
                  </>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            {integration?.configured ? (
              <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function QuickConnectGrid({
  templates,
  onConnect,
}: {
  templates: IntegrationTemplate[];
  onConnect: (template: IntegrationTemplate) => void;
}) {
  if (templates.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-medium text-muted-foreground">Quick Connect</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onConnect(template)}
            className="group flex flex-col items-center gap-2 rounded-xl border border-dashed p-4 text-center transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: `${template.color}18` }}
            >
              {template.icon}
            </div>
            <span className="text-xs font-medium truncate w-full">{template.name}</span>
            <span className="text-[10px] text-orange-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Connect →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function IntegrationsContent() {
  const { integrations, removeIntegration } = useOpenClawStore();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('channels');
  const [configuringTemplate, setConfiguringTemplate] = useState<IntegrationTemplate | null>(null);

  // Map integrations by id for quick lookup
  const integrationMap = useMemo(() => {
    const map = new Map<string, Integration>();
    integrations.forEach((i) => map.set(i.id, i));
    return map;
  }, [integrations]);

  // Get templates for active category
  const categoryTemplates = useMemo(() => {
    return INTEGRATION_TEMPLATES.filter(
      (t) => categoryFromType(t.type) === activeCategory
    );
  }, [activeCategory]);

  // Split into configured and unconfigured
  const configuredTemplates = useMemo(
    () => categoryTemplates.filter((t) => integrationMap.get(t.id)?.configured),
    [categoryTemplates, integrationMap]
  );
  const unconfiguredTemplates = useMemo(
    () => categoryTemplates.filter((t) => !integrationMap.get(t.id)?.configured),
    [categoryTemplates, integrationMap]
  );

  // Count configured per category
  const configuredCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = {
      channels: 0,
      models: 0,
      webhooks: 0,
      storage: 0,
    };
    integrations.forEach((i) => {
      if (i.configured) {
        counts[categoryFromType(i.type)]++;
      }
    });
    return counts;
  }, [integrations]);

  const totalConfigured = integrations.filter((i) => i.configured).length;

  function handleConfigure(template: IntegrationTemplate) {
    setConfiguringTemplate(template);
  }

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Link2 className="h-6 w-6 text-orange-500" />
          Integrations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect chat channels, model providers, and services
        </p>
      </div>

      {/* ═══ Stats ═══ */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          <strong className="text-foreground">{totalConfigured}</strong> connected
        </span>
        <span className="text-border">•</span>
        <span className="flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
          <strong className="text-foreground">{INTEGRATION_TEMPLATES.length - totalConfigured}</strong> available
        </span>
      </div>

      {/* ═══ Category Tabs ═══ */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as CategoryKey)}>
        <TabsList className="grid w-full grid-cols-4">
          {(Object.entries(CATEGORY_META) as [CategoryKey, typeof CATEGORY_META[CategoryKey]][]).map(
            ([key, meta]) => {
              const Icon = meta.icon;
              return (
                <TabsTrigger key={key} value={key} className="gap-1.5 text-xs sm:text-sm">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{meta.label}</span>
                  <span className="sm:hidden">{meta.label.split(' ')[0]}</span>
                  {configuredCounts[key] > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 min-w-4 px-1 text-[10px] rounded-full"
                    >
                      {configuredCounts[key]}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            }
          )}
        </TabsList>

        {/* ═══ Tab Content ═══ */}
        {(['channels', 'models', 'webhooks', 'storage'] as CategoryKey[]).map((category) => {
          const catTemplates = INTEGRATION_TEMPLATES.filter(
            (t) => categoryFromType(t.type) === category
          );
          const catConfigured = catTemplates.filter((t) => integrationMap.get(t.id)?.configured);
          const catUnconfigured = catTemplates.filter((t) => !integrationMap.get(t.id)?.configured);

          return (
            <TabsContent key={category} value={category} className="space-y-6 mt-4">
              {/* Configured integrations */}
              {catConfigured.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-medium">Connected</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {catConfigured.map((template) => (
                      <IntegrationCard
                        key={template.id}
                        template={template}
                        integration={integrationMap.get(template.id)}
                        onConfigure={() => handleConfigure(template)}
                        onConnect={() => handleConfigure(template)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick connect for unconfigured */}
              {catUnconfigured.length > 0 && (
                <QuickConnectGrid
                  templates={catUnconfigured}
                  onConnect={(template) => handleConfigure(template)}
                />
              )}

              {/* Empty state */}
              {catTemplates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                    <Zap className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-medium">No integrations available</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check back later for new integrations in this category.
                  </p>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* ═══ Configure Sheet ═══ */}
      {configuringTemplate && (
        <ConfigureIntegrationSheet
          template={configuringTemplate}
          integration={integrationMap.get(configuringTemplate.id)}
          open={!!configuringTemplate}
          onOpenChange={(open) => {
            if (!open) setConfiguringTemplate(null);
          }}
        />
      )}
    </div>
  );
}
