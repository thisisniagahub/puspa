'use client';

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Link as LinkIcon, FileText, Plus, RefreshCw, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Capture {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  linkUrl: string | null;
  mediaUrl: string | null;
  status: string;
  convertedTo: string | null;
  convertedId: string | null;
  createdAt: string;
  creator?: { id: string; name: string; role: string };
}

function typeLabel(t: string) {
  if (t === "voice") return "Voice";
  if (t === "photo") return "Photo";
  if (t === "link") return "Link";
  return "Text";
}

function statusVariant(s: string): "default" | "secondary" | "outline" | "destructive" {
  if (s === "converted") return "default";
  if (s === "processed") return "secondary";
  if (s === "archived") return "outline";
  return "outline";
}

export default function CapturesPage() {
  const [items, setItems] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (status) qs.set("status", status);
      const res = await fetch(`/api/v1/captures?${qs.toString()}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setItems(json.data ?? []);
    } catch {
      toast.error("Gagal memuatkan Memos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => items, [items]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Memos</h1>
        <p className="text-muted-foreground">
          Capture cepat (ala AnyGen) untuk tukar jadi kes, nota, sumbangan, atau tugasan.
        </p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex-1 flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari title/content/link…"
          />
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant={status === "" ? "default" : "outline"} onClick={() => setStatus("")}>Semua</Button>
          <Button variant={status === "raw" ? "default" : "outline"} onClick={() => setStatus("raw")}>Raw</Button>
          <Button variant={status === "converted" ? "default" : "outline"} onClick={() => setStatus("converted")}>Converted</Button>
        </div>

        <CreateMemoDialog onCreated={(c) => { setItems((p) => [c, ...p]); }} />
        
        {/* Mobile floating CTA */}
        <div className="md:hidden fixed bottom-6 right-6 z-40">
          <CreateMemoFab onCreated={(c) => { setItems((p) => [c, ...p]); }} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Tiada memo lagi. Tekan “New Memo” untuk mula.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{c.title ?? "(Untitled memo)"}</CardTitle>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="secondary">{typeLabel(c.type)}</Badge>
                      <Badge variant={statusVariant(c.status)}>
                        {c.status === "converted" ? "Converted" : c.status}
                      </Badge>
                      {c.convertedTo && (
                        <Badge variant="outline">→ {c.convertedTo}</Badge>
                      )}
                    </div>
                  </div>
                  {c.status === "converted" ? (
                    <div className="rounded-full bg-green-50 dark:bg-green-950/30 p-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {c.content ? (
                  <p className="text-sm text-muted-foreground line-clamp-3">{c.content}</p>
                ) : c.linkUrl ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    <span className="truncate">{c.linkUrl}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Tiada content.</p>
                )}

                <ConvertDialog
                  capture={c}
                  onConverted={(next) => setItems((prev) => prev.map((x) => (x.id === next.id ? next : x)))}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="pt-2 text-xs text-muted-foreground">
        Nota: “Hold to talk” voice capture akan kita tambah sebagai fasa seterusnya (audio recording + transcription).
      </div>
    </div>
  );
}

function CreateMemoFab({ onCreated }: { onCreated: (c: Capture) => void }) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = setOpenProp ?? setOpenState;
  return (
    <>
      <Button
        size="icon"
        className="glass-ring rounded-full h-14 w-14"
        onClick={() => setOpen(true)}
        aria-label="New memo"
      >
        <Plus className="w-5 h-5" />
      </Button>
      <CreateMemoDialog open={open} setOpen={setOpen} onCreated={onCreated} />
    </>
  );
}

function CreateMemoDialog({
  onCreated,
  open: openProp,
  setOpen: setOpenProp,
}: {
  onCreated: (c: Capture) => void;
  open?: boolean;
  setOpen?: (v: boolean) => void;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = setOpenProp ?? setOpenState;

  const [tab, setTab] = useState<"text" | "link">("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const payload: any = {
        type: tab,
        title: title || undefined,
        content: tab === "text" ? (content || undefined) : undefined,
        linkUrl: tab === "link" ? (linkUrl || undefined) : undefined,
      };
      const res = await fetch("/api/v1/captures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "error");
      onCreated(json.data as Capture);
      toast.success("Memo disimpan");
      setOpen(false);
      setTitle("");
      setContent("");
      setLinkUrl("");
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal simpan memo");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-1" /> New Memo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Memo</DialogTitle>
          <DialogDescription>Capture cepat untuk operator. Nanti boleh convert jadi kes/nota.</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="text" className="gap-2"><FileText className="w-4 h-4" />Text</TabsTrigger>
            <TabsTrigger value="link" className="gap-2"><LinkIcon className="w-4 h-4" />Link</TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" />

            <TabsContent value="text" className="m-0">
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tulis memo ringkas…" rows={6} />
            </TabsContent>

            <TabsContent value="link" className="m-0">
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Paste link…" />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConvertDialog({ capture, onConverted }: { capture: Capture; onConverted: (c: Capture) => void }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<"note" | "case" | "donation" | "disbursement">("note");
  const [convertedId, setConvertedId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/captures/${capture.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, convertedId: convertedId || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "error");
      onConverted(json.data as Capture);
      toast.success("Capture converted");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal convert capture");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <Mic className="w-4 h-4" /> Convert / Mark
          </span>
          <span className="text-xs text-muted-foreground">{capture.status === "converted" ? "Converted" : "Raw"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert memo</DialogTitle>
          <DialogDescription>
            Untuk sekarang, conversion ni mark status + emit event ke OpenClaw.
            Fasa seterusnya: auto-create entity (case/donation) dari capture.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            {(["note", "case", "donation", "disbursement"] as const).map((t) => (
              <Button
                key={t}
                variant={target === t ? "default" : "outline"}
                onClick={() => setTarget(t)}
                className="capitalize"
              >
                {t}
              </Button>
            ))}
          </div>

          <Input
            value={convertedId}
            onChange={(e) => setConvertedId(e.target.value)}
            placeholder="convertedId (optional) — contohnya Case ID"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Saving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
