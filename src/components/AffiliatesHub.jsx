import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Clock3, ExternalLink, Plus, Radio, RefreshCcw, Trash2, Users, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const PLATFORM_KEYS = ['twitch', 'youtube', 'youtubeChannelId', 'kick', 'tiktok', 'discord', 'x', 'instagram', 'website'];
const PLATFORM_LABELS = {
  twitch: 'Twitch',
  youtube: 'YouTube Handle',
  youtubeChannelId: 'YouTube Channel ID',
  kick: 'Kick',
  tiktok: 'TikTok',
  discord: 'Discord',
  x: 'X',
  instagram: 'Instagram',
  website: 'Website',
};

function emptyHandles(handles = {}) {
  return PLATFORM_KEYS.reduce((acc, key) => ({ ...acc, [key]: String(handles?.[key] || '').trim() }), {});
}

function emptyAffiliateDraft(item = null) {
  return {
    id: item?.id || '',
    slug: item?.slug || '',
    displayName: item?.displayName || '',
    category: item?.category || 'streamer',
    status: item?.status || 'active',
    primaryPlatform: item?.primaryPlatform || 'twitch',
    managerName: item?.managerName || '',
    notes: item?.notes || '',
    isActive: item?.isActive !== false,
    handles: emptyHandles(item?.handles),
    goals: {
      targetAvgViewers: String(item?.goals?.targetAvgViewers ?? ''),
      targetHoursWeekly: String(item?.goals?.targetHoursWeekly ?? ''),
      targetPostsMonthly: String(item?.goals?.targetPostsMonthly ?? ''),
    },
    automation: {
      mode: item?.automation?.mode || 'manual',
      syncNotes: item?.automation?.syncNotes || '',
    },
  };
}

function emptySnapshotDraft(item = null) {
  return {
    capturedAt: new Date().toISOString().slice(0, 16),
    source: item?.automation?.mode === 'youtube_api' ? 'youtube_api' : 'manual',
    isLive: false,
    currentViewers: '',
    averageViewers: '',
    peakViewers: '',
    activityHours: '',
    followerCount: '',
    subscriberCount: '',
    viewCount: '',
    contentCount: '',
    notes: '',
  };
}

function dateLabel(value) {
  if (!value) return 'Not synced yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not synced yet';
  return date.toLocaleString();
}

function formatNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return '0';
  return new Intl.NumberFormat().format(number);
}

function formatDecimal(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return '0';
  return number % 1 === 0 ? String(number) : number.toFixed(1);
}

function platformBadgeClass(platform) {
  if (platform === 'youtube') return 'border-red-400/40 bg-red-500/12 text-red-100';
  if (platform === 'twitch') return 'border-fuchsia-400/40 bg-fuchsia-500/12 text-fuchsia-100';
  if (platform === 'kick') return 'border-emerald-400/40 bg-emerald-500/12 text-emerald-100';
  if (platform === 'tiktok') return 'border-cyan-400/40 bg-cyan-500/12 text-cyan-100';
  return 'border-white/10 bg-white/10 text-zinc-200';
}

function categoryBadgeClass(category) {
  if (category === 'creator') return 'border-cyan-400/40 bg-cyan-500/12 text-cyan-100';
  if (category === 'partner') return 'border-amber-400/40 bg-amber-500/12 text-amber-100';
  if (category === 'team') return 'border-emerald-400/40 bg-emerald-500/12 text-emerald-100';
  return 'border-fuchsia-400/40 bg-fuchsia-500/12 text-fuchsia-100';
}

function statusBadgeClass(status) {
  if (status === 'active') return 'border-emerald-400/40 bg-emerald-500/12 text-emerald-100';
  if (status === 'paused') return 'border-amber-400/40 bg-amber-500/12 text-amber-100';
  if (status === 'probation') return 'border-orange-400/40 bg-orange-500/12 text-orange-100';
  return 'border-zinc-500/35 bg-zinc-500/12 text-zinc-200';
}

function buildPlatformUrl(platform, value, extra = {}) {
  const cleaned = String(value || '').trim().replace(/^@/, '');
  if (!cleaned) return '';
  if (platform === 'website') return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
  if (platform === 'twitch') return `https://www.twitch.tv/${cleaned}`;
  if (platform === 'youtube') {
    if (extra.youtubeChannelId) return `https://www.youtube.com/channel/${extra.youtubeChannelId}`;
    return `https://www.youtube.com/@${cleaned}`;
  }
  if (platform === 'kick') return `https://kick.com/${cleaned}`;
  if (platform === 'tiktok') return `https://www.tiktok.com/@${cleaned}`;
  if (platform === 'instagram') return `https://www.instagram.com/${cleaned}`;
  if (platform === 'x') return `https://x.com/${cleaned}`;
  return '';
}

function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{label}</div>
        {Icon ? <Icon className="h-4 w-4 text-zinc-500" /> : null}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-2 text-xs text-zinc-500">{hint}</div> : null}
    </div>
  );
}

export default function AffiliatesHub({
  affiliates,
  selectedAffiliateSlug,
  setSelectedAffiliateSlug,
  canManageAffiliates,
  tableAvailable = true,
  onRefresh,
  onSaveAffiliate,
  onDeleteAffiliate,
  onSaveSnapshot,
  onSyncYouTubeAffiliate,
  youtubeAutomationAvailable = false,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [editorOpen, setEditorOpen] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [draft, setDraft] = useState(emptyAffiliateDraft());
  const [snapshotDraft, setSnapshotDraft] = useState(emptySnapshotDraft());

  const visibleAffiliates = useMemo(() => {
    const base = canManageAffiliates ? affiliates : affiliates.filter(item => item.isActive !== false);
    const query = search.trim().toLowerCase();
    return base.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (platformFilter !== 'All' && item.primaryPlatform !== platformFilter) return false;
      if (!query) return true;
      const haystack = [
        item.displayName,
        item.managerName,
        item.notes,
        item.category,
        item.primaryPlatform,
        ...Object.values(item.handles || {}),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [affiliates, canManageAffiliates, platformFilter, search, statusFilter]);

  const selected = visibleAffiliates.find(item => item.slug === selectedAffiliateSlug)
    || affiliates.find(item => item.slug === selectedAffiliateSlug)
    || visibleAffiliates[0]
    || affiliates[0]
    || null;

  useEffect(() => {
    if (!selected && selectedAffiliateSlug) setSelectedAffiliateSlug('');
    if (!selectedAffiliateSlug && selected?.slug) setSelectedAffiliateSlug(selected.slug);
  }, [selected, selectedAffiliateSlug, setSelectedAffiliateSlug]);

  const latestSnapshots = useMemo(() => affiliates.map(item => item.latestSnapshot).filter(Boolean), [affiliates]);
  const liveCount = latestSnapshots.filter(snapshot => snapshot?.isLive).length;
  const averageViewersAcrossTracked = latestSnapshots.length
    ? Math.round(latestSnapshots.reduce((sum, snapshot) => sum + Number(snapshot?.averageViewers || snapshot?.currentViewers || 0), 0) / latestSnapshots.length)
    : 0;
  const totalHoursTracked = latestSnapshots.reduce((sum, snapshot) => sum + Number(snapshot?.activityHours || 0), 0);

  function openCreate() {
    setDraft(emptyAffiliateDraft());
    setEditorOpen(true);
  }

  function openEdit(item) {
    setDraft(emptyAffiliateDraft(item));
    setEditorOpen(true);
  }

  function openSnapshot(item) {
    setSnapshotDraft(emptySnapshotDraft(item));
    setSnapshotOpen(true);
  }

  async function saveEditor() {
    const savedSlug = await onSaveAffiliate?.(draft);
    if (savedSlug) {
      setSelectedAffiliateSlug(savedSlug);
      setEditorOpen(false);
    }
  }

  async function saveSnapshot() {
    if (!selected) return;
    const saved = await onSaveSnapshot?.(selected, snapshotDraft);
    if (saved) setSnapshotOpen(false);
  }

  async function deleteSelected() {
    if (!selected) return;
    const confirmed = window.confirm(`Delete "${selected.displayName}" from Drill-UK Affiliates?`);
    if (!confirmed) return;
    const deleted = await onDeleteAffiliate?.(selected);
    if (deleted) {
      setSelectedAffiliateSlug('');
      setEditorOpen(false);
    }
  }

  const automationSummary = selected?.automation?.mode === 'youtube_api'
    ? youtubeAutomationAvailable
      ? 'YouTube public sync is available. Subscriber totals, video count, and live-state checks can be refreshed from the dashboard.'
      : 'This entry is set to YouTube sync, but `VITE_YOUTUBE_API_KEY` is not configured in the frontend environment yet.'
    : selected?.automation?.mode === 'twitch_api'
      ? 'Twitch live stats are best synced through a server-side token flow. The panel is ready for that, but this frontend build does not store Twitch secrets client-side.'
      : 'Manual mode keeps the tracking accurate without external API dependencies. Use snapshots after streams, uploads, or weekly reviews.';

  return (
    <div className="grid gap-4 xl:grid-cols-[360px,1fr]">
      <Card className="border-white/10 bg-white/5 xl:sticky xl:top-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Drill-UK Affiliates</span>
            <Badge className="border-white/10 bg-white/10 text-zinc-200">{visibleAffiliates.length} shown</Badge>
          </CardTitle>
          <div className="space-y-3">
            <Input
              name="affiliate-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search creators, streamers, or handles..."
              className="border-white/10 bg-black/30 text-white placeholder:text-zinc-500"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-white/10 bg-black/30 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {['All', 'active', 'paused', 'probation', 'inactive'].map(value => (
                    <SelectItem key={value} value={value}>{value === 'All' ? 'All statuses' : value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="border-white/10 bg-black/30 text-white">
                  <SelectValue placeholder="Filter by platform" />
                </SelectTrigger>
                <SelectContent>
                  {['All', 'twitch', 'youtube', 'kick', 'tiktok', 'other'].map(value => (
                    <SelectItem key={value} value={value}>{value === 'All' ? 'All platforms' : value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={onRefresh} className="flex-1 min-w-[140px]">
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            {canManageAffiliates && (
              <Button onClick={openCreate} className="flex-1 min-w-[140px]">
                <Plus className="mr-2 h-4 w-4" /> New Affiliate
              </Button>
            )}
          </div>
          {!tableAvailable && (
            <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4 text-sm text-amber-100">
              Drill-UK Affiliates is not enabled in Supabase yet. Run the latest SQL block first.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Tracked" value={formatNumber(affiliates.length)} hint="Active affiliate profiles" icon={Users} />
            <StatCard label="Live Now" value={formatNumber(liveCount)} hint="Based on the latest saved snapshot" icon={Radio} />
            <StatCard label="Avg Viewers" value={formatNumber(averageViewersAcrossTracked)} hint="Average from the latest stored stats" icon={Activity} />
            <StatCard label="Hours Logged" value={formatDecimal(totalHoursTracked)} hint="Total activity hours from the latest snapshot per affiliate" icon={Clock3} />
          </div>
          <div className="max-h-[calc(100vh-520px)] space-y-3 overflow-y-auto pr-1">
            {visibleAffiliates.map((item) => {
              const latest = item.latestSnapshot || null;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setSelectedAffiliateSlug(item.slug)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selected?.slug === item.slug ? 'border-fuchsia-500/45 bg-fuchsia-500/12' : 'border-white/10 bg-black/25 hover:bg-white/5'}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={platformBadgeClass(item.primaryPlatform)}>{item.primaryPlatform}</Badge>
                    <Badge className={categoryBadgeClass(item.category)}>{item.category}</Badge>
                    <Badge className={statusBadgeClass(item.status)}>{item.status}</Badge>
                    {latest?.isLive && <Badge className="border-emerald-400/40 bg-emerald-500/12 text-emerald-100">Live</Badge>}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-white">{item.displayName}</div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-400">
                    <span>{formatNumber(latest?.averageViewers || latest?.currentViewers)} avg viewers</span>
                    <span>{formatDecimal(latest?.activityHours)} hrs</span>
                    <span>{dateLabel(latest?.capturedAt)}</span>
                  </div>
                </button>
              );
            })}
            {!visibleAffiliates.length && (
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
                No affiliate profiles match this filter yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {selected ? (
          <>
            <Card className="border-white/10 bg-white/5">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={platformBadgeClass(selected.primaryPlatform)}>{selected.primaryPlatform}</Badge>
                      <Badge className={categoryBadgeClass(selected.category)}>{selected.category}</Badge>
                      <Badge className={statusBadgeClass(selected.status)}>{selected.status}</Badge>
                      {selected.latestSnapshot?.isLive && <Badge className="border-emerald-400/40 bg-emerald-500/12 text-emerald-100">Live Now</Badge>}
                    </div>
                    <CardTitle className="mt-3 text-2xl">{selected.displayName}</CardTitle>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-400">
                      <span>Manager: {selected.managerName || 'Unassigned'}</span>
                      <span>Updated: {dateLabel(selected.updatedAt)}</span>
                    </div>
                  </div>
                  {canManageAffiliates && (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => openSnapshot(selected)} className="min-w-[144px]">
                        Log Snapshot
                      </Button>
                      <Button variant="secondary" onClick={() => openEdit(selected)}>
                        Edit Profile
                      </Button>
                      {selected.automation?.mode === 'youtube_api' && (
                        <Button
                          variant="secondary"
                          onClick={() => onSyncYouTubeAffiliate?.(selected)}
                          disabled={!youtubeAutomationAvailable}
                          className="border-red-400/30 bg-[linear-gradient(135deg,rgba(20,20,24,0.94),rgba(127,29,29,0.32))] hover:bg-[linear-gradient(135deg,rgba(39,39,42,0.94),rgba(153,27,27,0.36))]"
                        >
                          Sync YouTube
                        </Button>
                      )}
                      <Button variant="secondary" onClick={deleteSelected} className="border-red-400/30 text-red-100 hover:text-red-50">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
                <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(10,10,15,0.96),rgba(14,116,144,0.08),rgba(88,28,135,0.12))] p-4 text-sm text-zinc-300">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Automation</div>
                  <div className="mt-2 font-medium text-white">{selected.automation?.mode?.replace('_', ' ') || 'manual'}</div>
                  <div className="mt-2 leading-6">{automationSummary}</div>
                  {selected.automation?.syncNotes ? (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
                      {selected.automation.syncNotes}
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Current Viewers"
                    value={formatNumber(selected.latestSnapshot?.currentViewers)}
                    hint={selected.latestSnapshot?.isLive ? 'Live pull or manual live snapshot' : 'Latest recorded snapshot'}
                    icon={Radio}
                  />
                  <StatCard
                    label="Average Viewers"
                    value={formatNumber(selected.latestSnapshot?.averageViewers)}
                    hint={`Target ${formatNumber(selected.goals?.targetAvgViewers)}`}
                    icon={Activity}
                  />
                  <StatCard
                    label="Activity Hours"
                    value={formatDecimal(selected.latestSnapshot?.activityHours)}
                    hint={`Weekly target ${formatDecimal(selected.goals?.targetHoursWeekly)} hrs`}
                    icon={Clock3}
                  />
                  <StatCard
                    label="Followers / Subs"
                    value={formatNumber(selected.latestSnapshot?.subscriberCount || selected.latestSnapshot?.followerCount)}
                    hint="Latest recorded audience total"
                    icon={Users}
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Handles</div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {Object.entries(selected.handles || {}).filter(([, value]) => String(value || '').trim()).map(([key, value]) => {
                        if (key === 'youtubeChannelId') return null;
                        const href = buildPlatformUrl(key, value, selected.handles);
                        return (
                          <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">{PLATFORM_LABELS[key] || key}</div>
                            <div className="mt-2 flex items-center justify-between gap-3">
                              <div className="min-w-0 text-sm font-medium text-white">{String(value)}</div>
                              {href ? (
                                <a href={href} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center rounded-[16px] border border-white/10 bg-white/8 px-3 text-xs font-semibold text-zinc-100 transition hover:bg-white/12">
                                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open
                                </a>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {!Object.values(selected.handles || {}).some(value => String(value || '').trim()) && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
                        No handles saved yet.
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Performance Notes</div>
                    <div className="mt-4 space-y-3 text-sm text-zinc-300">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Snapshot cadence</div>
                        <div className="mt-2">Average viewers and activity hours work best when a Head Admin logs one snapshot after each stream or at least once per weekly review.</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Research-backed sync model</div>
                        <div className="mt-2">Twitch Helix is suited for live status and current viewers. YouTube Data can pull public channel totals, while YouTube Analytics is needed for owner-authorized watch metrics like average view duration.</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Internal notes</div>
                        <div className="mt-2 whitespace-pre-wrap">{selected.notes || 'No affiliate notes added yet.'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Recent Stat Snapshots</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selected.snapshots?.length ? selected.snapshots.slice(0, 8).map((snapshot) => (
                  <div key={snapshot.id} className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-white/10 bg-white/10 text-zinc-200">{snapshot.source.replace('_', ' ')}</Badge>
                        {snapshot.isLive && <Badge className="border-emerald-400/40 bg-emerald-500/12 text-emerald-100">Live</Badge>}
                        <Badge className="border-white/10 bg-white/10 text-zinc-200">{dateLabel(snapshot.capturedAt)}</Badge>
                      </div>
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Saved by dashboard</div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Current</div>
                        <div className="mt-2 text-lg font-semibold text-white">{formatNumber(snapshot.currentViewers)}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Average</div>
                        <div className="mt-2 text-lg font-semibold text-white">{formatNumber(snapshot.averageViewers)}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Peak</div>
                        <div className="mt-2 text-lg font-semibold text-white">{formatNumber(snapshot.peakViewers)}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Hours</div>
                        <div className="mt-2 text-lg font-semibold text-white">{formatDecimal(snapshot.activityHours)}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Audience</div>
                        <div className="mt-2 text-lg font-semibold text-white">{formatNumber(snapshot.subscriberCount || snapshot.followerCount)}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Content</div>
                        <div className="mt-2 text-lg font-semibold text-white">{formatNumber(snapshot.contentCount)}</div>
                      </div>
                    </div>
                    {snapshot.notes ? (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">{snapshot.notes}</div>
                    ) : null}
                  </div>
                )) : (
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
                    No stat snapshots logged yet for this affiliate.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6 text-sm text-zinc-400">
              No affiliate selected yet.
            </CardContent>
          </Card>
        )}
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-white/15 bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(10,10,15,0.98))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.5)]">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-lg font-semibold text-white">{draft.id ? 'Edit affiliate profile' : 'Create affiliate profile'}</div>
                <div className="mt-1 text-sm text-zinc-400">Track creator handles, targets, and the automation mode you want to use for this person.</div>
              </div>
              <button type="button" onClick={() => setEditorOpen(false)} className="rounded-2xl border border-white/10 bg-black/25 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white">Close</button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Display name</div>
                <Input name="affiliate-display-name" value={draft.displayName} onChange={(event) => setDraft(prev => ({ ...prev, displayName: event.target.value }))} className="border-white/10 bg-black/25 text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Slug</div>
                <Input name="affiliate-slug" value={draft.slug} onChange={(event) => setDraft(prev => ({ ...prev, slug: event.target.value }))} placeholder="Auto-generated if left blank" className="border-white/10 bg-black/25 text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Category</div>
                <Select value={draft.category} onValueChange={(value) => setDraft(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="border-white/10 bg-black/25 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="streamer">Streamer</SelectItem>
                    <SelectItem value="creator">Creator</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Status</div>
                <Select value={draft.status} onValueChange={(value) => setDraft(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="border-white/10 bg-black/25 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="probation">Probation</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Primary platform</div>
                <Select value={draft.primaryPlatform} onValueChange={(value) => setDraft(prev => ({ ...prev, primaryPlatform: value }))}>
                  <SelectTrigger className="border-white/10 bg-black/25 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitch">Twitch</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="kick">Kick</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Managed by</div>
                <Input name="affiliate-manager-name" value={draft.managerName} onChange={(event) => setDraft(prev => ({ ...prev, managerName: event.target.value }))} className="border-white/10 bg-black/25 text-white" />
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
                  <Input
                    name={`affiliate-handle-${key}`}
                    value={draft.handles[key] || ''}
                    onChange={(event) => setDraft(prev => ({ ...prev, handles: { ...prev.handles, [key]: event.target.value } }))}
                    className="border-white/10 bg-black/25 text-white"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Target avg viewers</div>
                <Input name="affiliate-target-avg-viewers" value={draft.goals.targetAvgViewers} onChange={(event) => setDraft(prev => ({ ...prev, goals: { ...prev.goals, targetAvgViewers: event.target.value } }))} className="border-white/10 bg-black/25 text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Target weekly hours</div>
                <Input name="affiliate-target-hours" value={draft.goals.targetHoursWeekly} onChange={(event) => setDraft(prev => ({ ...prev, goals: { ...prev.goals, targetHoursWeekly: event.target.value } }))} className="border-white/10 bg-black/25 text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Target monthly posts</div>
                <Input name="affiliate-target-posts" value={draft.goals.targetPostsMonthly} onChange={(event) => setDraft(prev => ({ ...prev, goals: { ...prev.goals, targetPostsMonthly: event.target.value } }))} className="border-white/10 bg-black/25 text-white" />
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Automation mode</div>
                <Select value={draft.automation.mode} onValueChange={(value) => setDraft(prev => ({ ...prev, automation: { ...prev.automation, mode: value } }))}>
                  <SelectTrigger className="border-white/10 bg-black/25 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual tracking</SelectItem>
                    <SelectItem value="youtube_api">YouTube API</SelectItem>
                    <SelectItem value="twitch_api">Twitch API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Active on dashboard</div>
                <Select value={draft.isActive ? 'yes' : 'no'} onValueChange={(value) => setDraft(prev => ({ ...prev, isActive: value === 'yes' }))}>
                  <SelectTrigger className="border-white/10 bg-black/25 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Automation notes</div>
              <Textarea name="affiliate-automation-notes" value={draft.automation.syncNotes} onChange={(event) => setDraft(prev => ({ ...prev, automation: { ...prev.automation, syncNotes: event.target.value } }))} rows={4} className="border-white/10 bg-black/25 text-white" />
            </div>
            <div className="mt-5 space-y-2">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Internal notes</div>
              <Textarea name="affiliate-notes" value={draft.notes} onChange={(event) => setDraft(prev => ({ ...prev, notes: event.target.value }))} rows={5} className="border-white/10 bg-black/25 text-white" />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={saveEditor}>Save Affiliate</Button>
              <Button variant="secondary" onClick={() => setEditorOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {snapshotOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[30px] border border-white/15 bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(10,10,15,0.98))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.5)]">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-lg font-semibold text-white">Log snapshot for {selected.displayName}</div>
                <div className="mt-1 text-sm text-zinc-400">Use this after a stream, weekly creator review, or manual stats pull.</div>
              </div>
              <button type="button" onClick={() => setSnapshotOpen(false)} className="rounded-2xl border border-white/10 bg-black/25 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white">Close</button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Captured at</div>
                <Input name="affiliate-snapshot-captured-at" type="datetime-local" value={snapshotDraft.capturedAt} onChange={(event) => setSnapshotDraft(prev => ({ ...prev, capturedAt: event.target.value }))} className="border-white/10 bg-black/25 text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Source</div>
                <Select value={snapshotDraft.source} onValueChange={(value) => setSnapshotDraft(prev => ({ ...prev, source: value }))}>
                  <SelectTrigger className="border-white/10 bg-black/25 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="youtube_api">YouTube API</SelectItem>
                    <SelectItem value="twitch_api">Twitch API</SelectItem>
                    <SelectItem value="weekly_review">Weekly Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Currently live</div>
                <Select value={snapshotDraft.isLive ? 'yes' : 'no'} onValueChange={(value) => setSnapshotDraft(prev => ({ ...prev, isLive: value === 'yes' }))}>
                  <SelectTrigger className="border-white/10 bg-black/25 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Current viewers</div>
                <Input name="affiliate-snapshot-current-viewers" value={snapshotDraft.currentViewers} onChange={(event) => setSnapshotDraft(prev => ({ ...prev, currentViewers: event.target.value }))} className="border-white/10 bg-black/25 text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Average viewers</div>
                <Input name="affiliate-snapshot-average-viewers" value={snapshotDraft.averageViewers} onChange={(event) => setSnapshotDraft(prev => ({ ...prev, averageViewers: event.target.value }))} className="border-white/10 bg-black/25 text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Peak viewers</div>
                <Input name="affiliate-snapshot-peak-viewers" value={snapshotDraft.peakViewers} onChange={(event) => setSnapshotDraft(prev => ({ ...prev, peakViewers: event.target.value }))} className="border-white/10 bg-black/25 text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Activity hours</div>
                <Input name="affiliate-snapshot-activity-hours" value={snapshotDraft.activityHours} onChange={(event) => setSnapshotDraft(prev => ({ ...prev, activityHours: event.target.value }))} className="border-white/10 bg-black/25 text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Followers</div>
                <Input name="affiliate-snapshot-followers" value={snapshotDraft.followerCount} onChange={(event) => setSnapshotDraft(prev => ({ ...prev, followerCount: event.target.value }))} className="border-white/10 bg-black/25 text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Subscribers</div>
                <Input name="affiliate-snapshot-subscribers" value={snapshotDraft.subscriberCount} onChange={(event) => setSnapshotDraft(prev => ({ ...prev, subscriberCount: event.target.value }))} className="border-white/10 bg-black/25 text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Total views</div>
                <Input name="affiliate-snapshot-view-count" value={snapshotDraft.viewCount} onChange={(event) => setSnapshotDraft(prev => ({ ...prev, viewCount: event.target.value }))} className="border-white/10 bg-black/25 text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Videos / posts</div>
                <Input name="affiliate-snapshot-content-count" value={snapshotDraft.contentCount} onChange={(event) => setSnapshotDraft(prev => ({ ...prev, contentCount: event.target.value }))} className="border-white/10 bg-black/25 text-white" />
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Notes</div>
              <Textarea name="affiliate-snapshot-notes" value={snapshotDraft.notes} onChange={(event) => setSnapshotDraft(prev => ({ ...prev, notes: event.target.value }))} rows={5} className="border-white/10 bg-black/25 text-white" />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={saveSnapshot}>
                <Video className="mr-2 h-4 w-4" /> Save Snapshot
              </Button>
              <Button variant="secondary" onClick={() => setSnapshotOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
