import React from 'react';
import { Search, Plus, ClipboardList, GraduationCap, Gavel, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EmployeeHub({
  filtered,
  selected,
  selectedId,
  setSelectedId,
  query,
  setQuery,
  filterOpen,
  setFilterOpen,
  filterRole,
  setFilterRole,
  filterTrainerOnly,
  setFilterTrainerOnly,
  filterActiveOnly,
  setFilterActiveOnly,
  filterWarningOnly,
  setFilterWarningOnly,
  roles,
  rankLabel,
  roleColor,
  statusColor,
  nameSizeClass,
  openAddStaffModal,
  canEdit,
  onOpenTracker,
  onOpenSession,
  onOpenProgression,
  onWarning,
  onDiscipline,
  onAssignQuiz,
}) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[380px,1fr]">
      <Card className="border-white/10 bg-white/5 xl:sticky xl:top-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Employee Directory</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setFilterOpen(v => !v)} className="rounded-xl border border-white/10 bg-black/30 px-3 py-1 text-xs text-zinc-300 hover:bg-white/10">
                Filters
              </button>
              <Badge className="border-white/10 bg-white/10 text-zinc-200">{filtered.length} shown</Badge>
            </div>
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search staff, trainer, rank..." className="border-white/10 bg-black/30 pl-9 text-white placeholder:text-zinc-500" />
          </div>
          {filterOpen && (
            <div className="mt-3 space-y-3 rounded-2xl border border-white/10 bg-black/25 p-3">
              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Rank</div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="border-white/10 bg-black/30 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All ranks</SelectItem>
                    {roles.map(role => <SelectItem key={role} value={role}>{rankLabel(role)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200">
                Is trainer
                <Checkbox checked={filterTrainerOnly} onCheckedChange={(v) => setFilterTrainerOnly(!!v)} />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200">
                Active only
                <Checkbox checked={filterActiveOnly} onCheckedChange={(v) => setFilterActiveOnly(!!v)} />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200">
                Has warning/action
                <Checkbox checked={filterWarningOnly} onCheckedChange={(v) => setFilterWarningOnly(!!v)} />
              </label>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex min-h-0 flex-col space-y-3">
          <Button disabled={!canEdit} onClick={openAddStaffModal} className="w-full rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500">
            <Plus className="mr-2 h-4 w-4" /> Add staff
          </Button>
          <div className="min-h-[420px] max-h-[calc(100vh-320px)] space-y-3 overflow-y-scroll pr-1">
            {filtered.map(member => (
              <button
                key={member.id}
                onClick={() => setSelectedId(member.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === member.id ? 'border-fuchsia-500/50 bg-fuchsia-500/10' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="h-11 w-11 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                      {member.profileImage ? (
                        <img src={member.profileImage} alt={`${member.name} profile`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">No img</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className={`${nameSizeClass(member.name)} min-w-0 max-w-[160px] truncate font-semibold`} title={member.name}>
                        {member.name}
                      </div>
                      <div className="mt-1 text-sm text-zinc-400">Trainer: {member.trainer}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge className={`${roleColor(member.role)} px-2 text-[10px]`}>{rankLabel(member.role)}</Badge>
                        <Badge className={`${statusColor(member.status)} px-2 text-[10px]`}>{member.status}</Badge>
                        {member.disciplinary?.warnings > 0 && <Badge className="border-red-500/30 bg-red-500/12 px-2 text-[10px] text-red-200">Warning {member.disciplinary.warnings}</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Employee Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[320px,1fr]">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                <div className="aspect-[0.72] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  {selected?.profileImage ? (
                    <img src={selected.profileImage} alt={`${selected.name} profile`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">No card image</div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-2xl font-semibold text-white">{selected?.name}</div>
                    <Badge className={`${roleColor(selected?.role)} px-2.5 text-[10px]`}>{rankLabel(selected?.role)}</Badge>
                    <Badge className={`${statusColor(selected?.status)} px-2.5 text-[10px]`}>{selected?.status}</Badge>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Trainer</div><div className="mt-2 text-sm text-white">{selected?.trainer}</div></div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Staff since</div><div className="mt-2 text-sm text-white">{selected?.staffSince}</div></div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Rank since</div><div className="mt-2 text-sm text-white">{selected?.modSince}</div></div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Readiness</div><div className="mt-2 text-sm text-white">{selected?.readiness}%</div></div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <Button onClick={onOpenTracker} className="rounded-2xl border border-white/15 bg-black/30 text-zinc-100 hover:bg-white/10"><ClipboardList className="mr-2 h-4 w-4" /> Full tracker</Button>
                  <Button onClick={onOpenSession} className="rounded-2xl border border-white/15 bg-black/30 text-zinc-100 hover:bg-white/10"><GraduationCap className="mr-2 h-4 w-4" /> Training session</Button>
                  <Button onClick={onOpenProgression} className="rounded-2xl border border-white/15 bg-black/30 text-zinc-100 hover:bg-white/10"><ArrowUpRight className="mr-2 h-4 w-4" /> Progression</Button>
                  <Button onClick={onWarning} className="rounded-2xl border border-amber-400/35 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18"><Gavel className="mr-2 h-4 w-4" /> Warning</Button>
                  <Button onClick={onDiscipline} className="rounded-2xl border border-red-400/35 bg-red-500/12 text-red-100 hover:bg-red-500/18"><ShieldAlert className="mr-2 h-4 w-4" /> Disciplinary action</Button>
                  <Button onClick={onAssignQuiz} className="rounded-2xl border border-cyan-400/35 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18"><ClipboardList className="mr-2 h-4 w-4" /> Assign quiz</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
