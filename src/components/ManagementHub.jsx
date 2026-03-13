import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ManagementHub({
  managementView,
  setManagementView,
  managementQuery,
  setManagementQuery,
  filteredCount,
  onOpenAudit,
  onOpenRanks,
  onOpenDirectory,
}) {
  const items = [
    { key: 'directory', label: 'All staff accounts' },
    { key: 'applicants', label: 'New applicants' },
    { key: 'head_admins', label: 'Head admins' },
  ];

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>Management Workspace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Directory filters</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {items.map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setManagementView(item.key);
                    onOpenDirectory();
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs ${managementView === item.key ? 'border-fuchsia-500/40 bg-fuchsia-500/18 text-fuchsia-200' : 'border-white/10 bg-black/25 text-zinc-300 hover:bg-white/10'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Input
              value={managementQuery}
              onChange={(event) => setManagementQuery(event.target.value)}
              placeholder="Search username or id..."
              className="mt-4 border-white/10 bg-black/30 text-white placeholder:text-zinc-500"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="border-white/10 bg-white/10 text-zinc-200">{filteredCount} users in current view</Badge>
              <Badge className="border-emerald-500/35 bg-emerald-500/12 text-emerald-100">Auto-link by matching username enabled</Badge>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Management tools</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Button onClick={onOpenAudit} className="rounded-2xl border border-cyan-400/35 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18">
                Open Audit Log
              </Button>
              <Button onClick={onOpenRanks} className="rounded-2xl border border-amber-400/35 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18">
                Open Rank Display
              </Button>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              The heavy management pages stay available, but this workspace gives you the tree-style entry point first so the top-level dashboard stays readable.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
