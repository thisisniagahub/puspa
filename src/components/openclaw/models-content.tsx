'use client';

import { useState, useMemo } from 'react';
import { useOpenClawStore, type ModelProvider } from '@/store/openclaw-store';
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Brain,
  Cpu,
  Settings,
  CheckCircle,
  XCircle,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  DollarSign,
  Play,
  Star,
  Crown,
  AlertTriangle,
  Plus,
  ChevronDown,
  FileText,
  Globe,
  Eye,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Provider colour map – gives each provider a distinctive hue + icon
// ---------------------------------------------------------------------------

const PROVIDER_COLORS: Record<string, string> = {
  Anthropic: 'bg-orange-500',
  OpenAI: 'bg-green-500',
  Google: 'bg-blue-500',
  Meta: 'bg-indigo-500',
  Groq: 'bg-red-500',
  Mistral: 'bg-cyan-600',
  'Together AI': 'bg-violet-600',
  Fireworks: 'bg-amber-500',
  OpenRouter: 'bg-teal-500',
  DeepSeek: 'bg-sky-500',
  Cohere: 'bg-rose-500',
  Perplexity: 'bg-lime-500',
  'AI21 Labs': 'bg-yellow-600',
  HuggingFace: 'bg-yellow-400',
  xAI: 'bg-gray-700',
  Ollama: 'bg-stone-600',
  Anyscale: 'bg-fuchsia-500',
  Replicate: 'bg-purple-600',
  Bedrock: 'bg-emerald-700',
  Vertex: 'bg-blue-700',
  Azure: 'bg-sky-700',
  Stability: 'bg-pink-600',
  ElevenLabs: 'bg-violet-700',
  Suno: 'bg-orange-600',
  Udio: 'bg-indigo-600',
};

function providerColor(name: string): string {
  for (const [key, color] of Object.entries(PROVIDER_COLORS)) {
    if (name.includes(key)) return color;
  }
  return 'bg-muted-foreground';
}

function providerInitial(name: string): string {
  const cleaned = name.replace(/\s*\(.*?\)\s*/g, '').trim();
  return cleaned.charAt(0).toUpperCase();
}

// ---------------------------------------------------------------------------
// Provider directory data (broad list to showcase 40+ providers)
// ---------------------------------------------------------------------------

const PROVIDER_DIRECTORY = [
  { name: 'Anthropic', models: 'Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku' },
  { name: 'OpenAI', models: 'GPT-4o, GPT-4o Mini, GPT-4 Turbo, o1, o1-mini, o3' },
  { name: 'Google', models: 'Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Ultra' },
  { name: 'Meta (local)', models: 'Llama 3.1 70B, Llama 3.1 8B, CodeLlama' },
  { name: 'Groq', models: 'Llama 3.1 70B, Mixtral 8x7B' },
  { name: 'Mistral', models: 'Mistral Large, Mistral Medium, Mistral Small, Codestral' },
  { name: 'OpenRouter', models: '200+ models via unified API' },
  { name: 'DeepSeek', models: 'DeepSeek-V2, DeepSeek Coder' },
  { name: 'Together AI', models: 'Llama, Mixtral, FLUX, SDXL' },
  { name: 'Fireworks', models: 'Llama 3.1, Mixtral, Aysnc Models' },
  { name: 'Cohere', models: 'Command R+, Command R, Embed' },
  { name: 'Perplexity', models: 'Sonar, Sonar Pro' },
  { name: 'AI21 Labs', models: 'Jamba 1.5, Jurassic-2' },
  { name: 'HuggingFace', models: 'Inference API, Serverless Endpoints' },
  { name: 'xAI', models: 'Grok-2, Grok-2 Mini' },
  { name: 'Ollama', models: 'Local: Llama, Mistral, Phi, Gemma' },
  { name: 'Anyscale', models: 'Llama, Mistral, Flan' },
  { name: 'Replicate', models: 'Llama, SDXL, Whisper, MusicGen' },
  { name: 'Amazon Bedrock', models: 'Claude, Titan, Llama, Mistral' },
  { name: 'Google Vertex', models: 'Gemini, Claude, Imagen' },
  { name: 'Azure OpenAI', models: 'GPT-4o, GPT-4, GPT-3.5' },
  { name: 'Stability AI', models: 'Stable Diffusion XL, SD3' },
  { name: 'ElevenLabs', models: 'Turbo v2, Multilingual v2' },
  { name: 'Suno', models: 'Suno v3.5 Music Generation' },
  { name: 'Udio', models: 'Udio v1.5 Music Generation' },
];

// ---------------------------------------------------------------------------
// Helper: status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: ModelProvider['status'] }) {
  const map: Record<ModelProvider['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
    active: { label: 'Active', variant: 'default', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/25' },
    degraded: { label: 'Degraded', variant: 'default', className: 'bg-amber-500/15 text-amber-600 border-amber-500/25 hover:bg-amber-500/25' },
    inactive: { label: 'Inactive', variant: 'secondary' },
    error: { label: 'Error', variant: 'destructive' },
  };
  const cfg = map[status];
  return (
    <Badge variant={cfg.variant} className={cn('text-[11px] font-medium', cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Helper: format cost per 1K tokens
// ---------------------------------------------------------------------------

function formatCost(costPerToken: number | null): string {
  if (costPerToken === null || costPerToken === 0) return 'Free';
  const per1k = costPerToken * 1000;
  if (per1k < 0.01) return `$${(per1k * 1000).toFixed(1)}/1M`;
  return `$${per1k.toFixed(2)}/1K`;
}

// ---------------------------------------------------------------------------
// Failover chain node
// ---------------------------------------------------------------------------

function FailoverNode({
  provider,
  label,
  onRemove,
}: {
  provider: ModelProvider;
  label: string;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold shadow-md',
            providerColor(provider.provider),
          )}
        >
          {providerInitial(provider.provider)}
        </div>
        <span className="mt-1 text-[10px] text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium leading-tight">{provider.name}</span>
        <span className="text-xs text-muted-foreground">{provider.provider}</span>
      </div>
      {onRemove && (
        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto text-muted-foreground hover:text-destructive" onClick={onRemove}>
          <XCircle className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ModelsContent() {
  const { modelProviders, addModelProvider, updateModelProvider, removeModelProvider } =
    useOpenClawStore();

  // Primary model ID
  const [primaryModelId, setPrimaryModelId] = useState<string>(modelProviders[0]?.id ?? '');

  // Failover chain (list of model IDs after the primary)
  const [failoverChain, setFailoverChain] = useState<string[]>(modelProviders.length > 1 ? [modelProviders[1]?.id ?? ''] : []);

  // Specialized model selections
  const [imageModelId, setImageModelId] = useState('model-gemini-pro');
  const [pdfModelId, setPdfModelId] = useState('model-claude-35-sonnet');
  const [imgGenModelId, setImgGenModelId] = useState('model-gpt-4o');
  const [vidGenModelId, setVidGenModelId] = useState('');
  const [musicGenModelId, setMusicGenModelId] = useState('');

  // Allowlist
  const [allowlist, setAllowlist] = useState<string[]>(
    modelProviders.map((m) => m.id),
  );
  const [newAllowlistId, setNewAllowlistId] = useState('');
  const [allowAll, setAllowAll] = useState(true);

  // Test status per model
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'fail'>>({});

  // Directory filter
  const [directoryFilter, setDirectoryFilter] = useState('');

  // ---- Derived ----
  const primaryModel = modelProviders.find((m) => m.id === primaryModelId);
  const failoverModels = failoverChain
    .map((id) => modelProviders.find((m) => m.id === id))
    .filter(Boolean) as ModelProvider[];

  const filteredDirectory = useMemo(() => {
    if (!directoryFilter) return PROVIDER_DIRECTORY;
    const q = directoryFilter.toLowerCase();
    return PROVIDER_DIRECTORY.filter(
      (p) => p.name.toLowerCase().includes(q) || p.models.toLowerCase().includes(q),
    );
  }, [directoryFilter]);

  // ---- Handlers ----
  const handleSetPrimary = (id: string) => {
    setPrimaryModelId(id);
    setFailoverChain((prev) => prev.filter((fid) => fid !== id));
  };

  const handleAddFailover = (id: string) => {
    if (id !== primaryModelId && !failoverChain.includes(id)) {
      setFailoverChain((prev) => [...prev, id]);
    }
  };

  const handleRemoveFailover = (id: string) => {
    setFailoverChain((prev) => prev.filter((fid) => fid !== id));
  };

  const handleTestModel = (id: string) => {
    setTestingId(id);
    setTimeout(() => {
      const success = Math.random() > 0.15;
      setTestResults((prev) => ({ ...prev, [id]: success ? 'success' : 'fail' }));
      setTestingId(null);
    }, 1500);
  };

  const handleAllowlistAdd = () => {
    if (newAllowlistId && !allowlist.includes(newAllowlistId)) {
      setAllowlist((prev) => [...prev, newAllowlistId]);
      setNewAllowlistId('');
    }
  };

  const handleAllowlistRemove = (id: string) => {
    setAllowlist((prev) => prev.filter((a) => a !== id));
  };

  const handleAllowAll = () => {
    if (allowAll) {
      setAllowAll(false);
      setAllowlist([primaryModelId]);
    } else {
      setAllowAll(true);
      setAllowlist(modelProviders.map((m) => m.id));
    }
  };

  const handleRemoveModel = (id: string) => {
    removeModelProvider(id);
    if (primaryModelId === id) {
      const remaining = modelProviders.filter((m) => m.id !== id);
      setPrimaryModelId(remaining[0]?.id ?? '');
    }
    setFailoverChain((prev) => prev.filter((fid) => fid !== id));
    setAllowlist((prev) => prev.filter((a) => a !== id));
  };

  // ---- Available failover candidates ----
  const failoverCandidates = modelProviders.filter(
    (m) => m.id !== primaryModelId && !failoverChain.includes(m.id),
  );

  return (
    <div className="space-y-8 p-6">
      {/* ================================================================= */}
      {/* Header                                                            */}
      {/* ================================================================= */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Models</h1>
            <p className="text-sm text-muted-foreground">
              Configure model providers and failover chains
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Model Provider Cards                                              */}
      {/* ================================================================= */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Cpu className="h-5 w-5 text-muted-foreground" />
            Configured Providers
            <Badge variant="outline" className="text-xs font-normal ml-1">
              {modelProviders.length}
            </Badge>
          </h2>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Provider
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modelProviders.map((model) => (
            <Card
              key={model.id}
              className={cn(
                'relative transition-all hover:shadow-md',
                primaryModelId === model.id && 'ring-2 ring-violet-500/50 border-violet-500/30',
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold shadow-sm',
                        providerColor(model.provider),
                      )}
                    >
                      {providerInitial(model.provider)}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-semibold leading-tight truncate">
                        {model.provider} {model.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {model.id}
                      </CardDescription>
                    </div>
                  </div>
                  <StatusBadge status={model.status} />
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* API Key status */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {model.apiKeyConfigured ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                    {model.apiKeyConfigured ? 'API Key Set' : 'No API Key'}
                  </span>

                  {/* Latency */}
                  {model.latency !== null && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {(model.latency / 1000).toFixed(1)}s avg
                    </span>
                  )}

                  {/* Cost */}
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {formatCost(model.costPerToken)}
                  </span>
                </div>

                <Separator />

                {/* Primary badge or Set Primary button */}
                <div className="flex items-center justify-between">
                  {primaryModelId === model.id ? (
                    <Badge className="bg-violet-500/15 text-violet-600 border-violet-500/25 text-[11px]">
                      <Crown className="h-3 w-3 mr-1" />
                      Primary
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleSetPrimary(model.id)}
                    >
                      <Star className="h-3 w-3" />
                      Set as Primary
                    </Button>
                  )}

                  {/* Test result indicator */}
                  {testResults[model.id] === 'success' && (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                      <CheckCircle className="h-3 w-3 mr-0.5" /> Passed
                    </Badge>
                  )}
                  {testResults[model.id] === 'fail' && (
                    <Badge variant="destructive" className="text-[10px]">
                      <AlertTriangle className="h-3 w-3 mr-0.5" /> Failed
                    </Badge>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => updateModelProvider(model.id, { status: model.status === 'active' ? 'inactive' : 'active' })}
                  >
                    <Settings className="h-3 w-3" />
                    Configure
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    disabled={testingId === model.id}
                    onClick={() => handleTestModel(model.id)}
                  >
                    {testingId === model.id ? (
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-violet-500" />
                        Testing…
                      </span>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        Test
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveModel(model.id)}
                    disabled={primaryModelId === model.id}
                  >
                    <XCircle className="h-3 w-3" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* Model Failover Configuration                                      */}
      {/* ================================================================= */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Model Failover Chain</CardTitle>
            </div>
            <CardDescription>
              When the primary model is unavailable or returns an error, OpenClaw automatically
              falls through to the next provider in the chain. This ensures continuous operation
              even during provider outages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual chain */}
            <div className="flex flex-wrap items-center gap-3">
              {primaryModel && (
                <FailoverNode provider={primaryModel} label="Primary" />
              )}

              {failoverModels.map((fm, idx) => (
                <div key={fm.id} className="flex items-center gap-3">
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <FailoverNode
                    provider={fm}
                    label={`Fallback ${idx + 1}`}
                    onRemove={() => handleRemoveFailover(fm.id)}
                  />
                </div>
              ))}

              {/* Add fallback button */}
              {failoverCandidates.length > 0 && (
                <div className="flex items-center gap-3">
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select onValueChange={handleAddFailover}>
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="Add Fallback…" />
                    </SelectTrigger>
                    <SelectContent>
                      {failoverCandidates.map((fc) => (
                        <SelectItem key={fc.id} value={fc.id} className="text-xs">
                          {fc.provider} {fc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {failoverChain.length === 0 && failoverCandidates.length === 0 && (
                <span className="text-xs text-muted-foreground italic">
                  No additional fallback models available
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              <Zap className="inline h-3 w-3 mr-1 text-amber-500" />
              Failover is triggered when a request times out, returns a 5xx error, or when the
              provider status is degraded. Each fallback is attempted once before propagating the
              error to the caller. Drag to reorder priority (coming soon).
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ================================================================= */}
      {/* Specialized Model Settings                                        */}
      {/* ================================================================= */}
      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-muted-foreground" />
          Specialized Model Settings
        </h2>

        <Accordion type="multiple" className="w-full">
          {/* Image Model */}
          <Card className="mb-2 overflow-hidden">
            <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-muted/30 transition-colors [&[data-state=open]]:bg-muted/30">
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-medium">Image Model</span>
                  <span className="block text-xs text-muted-foreground">
                    Vision model for image analysis and understanding
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div className="grid gap-3 max-w-sm">
                <Label className="text-xs text-muted-foreground">Selected Image Model</Label>
                <Select value={imageModelId} onValueChange={setImageModelId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelProviders.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.provider} {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used for vision tasks like image description, OCR, and visual Q&A.
                </p>
              </div>
            </AccordionContent>
          </Card>

          {/* PDF Model */}
          <Card className="mb-2 overflow-hidden">
            <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-muted/30 transition-colors [&[data-state=open]]:bg-muted/30">
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-medium">PDF Model</span>
                  <span className="block text-xs text-muted-foreground">
                    Model for document processing and extraction
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div className="grid gap-3 max-w-sm">
                <Label className="text-xs text-muted-foreground">Selected PDF Model</Label>
                <Select value={pdfModelId} onValueChange={setPdfModelId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelProviders.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.provider} {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used for parsing PDFs, extracting text, tables, and structured data from documents.
                </p>
              </div>
            </AccordionContent>
          </Card>

          {/* Image Generation Model */}
          <Card className="mb-2 overflow-hidden">
            <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-muted/30 transition-colors [&[data-state=open]]:bg-muted/30">
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-medium">Image Generation Model</span>
                  <span className="block text-xs text-muted-foreground">
                    Model for generating images from text prompts
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div className="grid gap-3 max-w-sm">
                <Label className="text-xs text-muted-foreground">Selected Image Generation Model</Label>
                <Select value={imgGenModelId} onValueChange={setImgGenModelId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select a model…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dall-e-3">DALL-E 3 (OpenAI)</SelectItem>
                    <SelectItem value="sdxl">Stable Diffusion XL</SelectItem>
                    <SelectItem value="stable-diffusion-3">Stable Diffusion 3</SelectItem>
                    <SelectItem value="midjourney">Midjourney (via API)</SelectItem>
                    <SelectItem value="flux">FLUX 1.1 Pro</SelectItem>
                    <SelectItem value="imagen">Imagen 3 (Google)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Generates images from text prompts. Different models have different style strengths.
                </p>
              </div>
            </AccordionContent>
          </Card>

          {/* Video Generation Model */}
          <Card className="mb-2 overflow-hidden">
            <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-muted/30 transition-colors [&[data-state=open]]:bg-muted/30">
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                  <Play className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-medium">Video Generation Model</span>
                  <span className="block text-xs text-muted-foreground">
                    Model for generating video content
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div className="grid gap-3 max-w-sm">
                <Label className="text-xs text-muted-foreground">Selected Video Generation Model</Label>
                <Select value={vidGenModelId} onValueChange={setVidGenModelId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select a model…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="runway-gen3">Runway Gen-3 Alpha</SelectItem>
                    <SelectItem value="pika-1.0">Pika 1.0</SelectItem>
                    <SelectItem value="lumalabs">Luma Dream Machine</SelectItem>
                    <SelectItem value="kling">Kling AI</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Generates short video clips from text prompts or images.
                </p>
              </div>
            </AccordionContent>
          </Card>

          {/* Music Generation Model */}
          <Card className="mb-2 overflow-hidden">
            <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-muted/30 transition-colors [&[data-state=open]]:bg-muted/30">
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-medium">Music Generation Model</span>
                  <span className="block text-xs text-muted-foreground">
                    Model for generating music and audio
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div className="grid gap-3 max-w-sm">
                <Label className="text-xs text-muted-foreground">Selected Music Generation Model</Label>
                <Select value={musicGenModelId} onValueChange={setMusicGenModelId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select a model…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suno-v3.5">Suno v3.5</SelectItem>
                    <SelectItem value="udio-v1.5">Udio v1.5</SelectItem>
                    <SelectItem value="musicgen">MusicGen (Meta)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Generates music tracks from text descriptions of genre, mood, and style.
                </p>
              </div>
            </AccordionContent>
          </Card>
        </Accordion>
      </section>

      {/* ================================================================= */}
      {/* Model Allowlist                                                   */}
      {/* ================================================================= */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Model Allowlist
                </CardTitle>
                <CardDescription className="mt-1">
                  Restrict which models agents can use. Only allowlisted models will be available.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="allow-all-switch" className="text-xs text-muted-foreground">
                  Allow All
                </Label>
                <Switch
                  id="allow-all-switch"
                  checked={allowAll}
                  onCheckedChange={handleAllowAll}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!allowAll && (
              <div className="flex items-center gap-2 max-w-md">
                <Select value={newAllowlistId} onValueChange={setNewAllowlistId}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Select model to add…" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelProviders
                      .filter((m) => !allowlist.includes(m.id))
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.provider} {m.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleAllowlistAdd}>
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Model</TableHead>
                  <TableHead className="text-xs">Provider</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  {!allowAll && <TableHead className="text-xs w-[60px]">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelProviders
                  .filter((m) => allowAll || allowlist.includes(m.id))
                  .map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="text-sm font-medium">{model.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {model.provider}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={model.status} />
                      </TableCell>
                      {!allowAll && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleAllowlistRemove(model.id)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                {!allowAll && allowlist.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">
                      No models in allowlist. Agents will have no model access.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* ================================================================= */}
      {/* Provider Directory                                                */}
      {/* ================================================================= */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            Provider Directory
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and connect from {PROVIDER_DIRECTORY.length}+ supported providers.
          </p>
        </div>

        <Input
          placeholder="Search providers…"
          value={directoryFilter}
          onChange={(e) => setDirectoryFilter(e.target.value)}
          className="max-w-sm mb-4 h-8 text-sm"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredDirectory.map((prov) => {
            const isConfigured = modelProviders.some((mp) =>
              mp.provider.includes(prov.name),
            );
            return (
              <Card
                key={prov.name}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md hover:border-primary/30',
                  isConfigured && 'border-emerald-500/30 bg-emerald-500/[0.03]',
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold',
                        providerColor(prov.name),
                      )}
                    >
                      {providerInitial(prov.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{prov.name}</span>
                        {isConfigured && (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                        {prov.models}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={isConfigured ? 'ghost' : 'outline'}
                    size="sm"
                    className="w-full mt-3 h-7 text-xs"
                    onClick={() => {
                      if (!isConfigured) {
                        addModelProvider({
                          id: `model-${prov.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
                          name: prov.models.split(',')[0].trim(),
                          provider: prov.name,
                          status: 'inactive',
                          apiKeyConfigured: false,
                          latency: null,
                          costPerToken: null,
                        });
                      }
                    }}
                  >
                    {isConfigured ? 'Configure' : 'Connect'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredDirectory.length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground">
            No providers matching &quot;{directoryFilter}&quot;
          </div>
        )}
      </section>
    </div>
  );
}


