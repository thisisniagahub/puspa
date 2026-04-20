'use client';

import { FileText, Plus, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatusBadge, PriorityBadge } from "@/components/shared/badges";

// Case status pipeline definition
const CASE_PIPELINE = [
  { key: "pending", label: "Menunggu Verifikasi", statuses: ["draft", "submitted", "verifying"] },
  { key: "review", label: "Semakan & Penilaian", statuses: ["verified", "scoring", "scored"] },
  { key: "active", label: "Aktif", statuses: ["approved", "disbursing", "disbursed", "follow_up"] },
  { key: "done", label: "Selesai", statuses: ["closed", "rejected"] },
];

export default function CasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pengurusan Kes</h1>
          <p className="text-muted-foreground">Case management untuk asnaf dan penerima bantuan</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Kes Baru
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari kes, nama pemohon, no. IC..." className="pl-9" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" /> Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CASE_PIPELINE.map((stage) => (
          <Card key={stage.key}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stage.label}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-bold">0</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cases Table Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Senarai Kes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-16 text-center">
            <div>
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-semibold">Tiada kes untuk dipaparkan</p>
              <p className="text-sm text-muted-foreground mt-1">
                Mulakan dengan menambah kes baharu atau seed database
              </p>
              <Button variant="outline" className="mt-4" onClick={() => fetch("/api/seed", { method: "POST" })}>
                Seed Database
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
