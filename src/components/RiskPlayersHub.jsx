import React, { useMemo, useState } from 'react';
import { AlertTriangle, FileText, RefreshCcw, ShieldAlert, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { parseRiskPlayerLog } from '@/riskPlayerParser';

function humanDate(value) {
  if (!value) return 'Not uploaded yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not uploaded yet';
  return date.toLocaleString();
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function summaryCard(label, value, Icon, tone = 'text-zinc-400') {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

export default function RiskPlayersHub({
  latestUpload,
  uploadHistory,
  tableAvailable = true,
  canManageRiskPlayers,
  onRefresh,
  onSaveUpload,
}) {
  const [selectedUploadId, setSelectedUploadId] = useState('');
  const [localReport, setLocalReport] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const selectedUpload = useMemo(() => {
    if (!selectedUploadId) return latestUpload || null;
    return uploadHistory.find(upload => upload.id === selectedUploadId) || latestUpload || null;
  }, [latestUpload, selectedUploadId, uploadHistory]);

  const activeReport = localReport || selectedUpload?.report || null;
  const topPlayers = activeReport?.topPlayers || [];
  const allPlayers = activeReport?.players || [];
  const summary = activeReport?.summary || {};

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const text = await file.text();
      const parsed = parseRiskPlayerLog(text);
      setLocalReport({
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        report: parsed,
      });
      if (canManageRiskPlayers && onSaveUpload) {
        const saved = await onSaveUpload(file.name, text, parsed);
        if (saved) {
          setLocalReport(null);
          setSelectedUploadId('');
        }
      }
    } catch (err) {
      setError(err?.message || 'Risk player file could not be parsed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[360px,1fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Risk Players</span>
              <Badge className="border-red-400/35 bg-red-500/12 text-red-100">Top 10</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Upload className="h-4 w-4 text-cyan-200" />
                Weekly TXT upload
              </div>
              <Input
                name="risk-player-upload"
                type="file"
                accept=".txt,text/plain"
                disabled={!canManageRiskPlayers || uploading}
                onChange={(event) => {
                  void handleFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
                className="mt-3 border-white/10 bg-black/30 text-white file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-3 file:py-1 file:text-cyan-50"
              />
              <div className="mt-3 text-xs leading-5 text-zinc-500">
                Completion or confirm rows are ignored. Only new community-service punishments are counted as risk entries.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={onRefresh} disabled={uploading} className="flex-1">
                <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>

            {!tableAvailable && (
              <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4 text-sm text-amber-100">
                Risk Players is not enabled in Supabase yet. Run the latest SQL block first.
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-400/35 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>
            )}

            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Upload History</div>
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {uploadHistory.map(upload => (
                  <button
                    key={upload.id}
                    type="button"
                    onClick={() => {
                      setLocalReport(null);
                      setSelectedUploadId(upload.id);
                    }}
                    className={`w-full rounded-2xl border p-3 text-left transition ${selectedUpload?.id === upload.id && !localReport ? 'border-cyan-400/35 bg-cyan-500/12' : 'border-white/10 bg-black/25 hover:bg-white/5'}`}
                  >
                    <div className="line-clamp-1 text-sm font-semibold text-white">{upload.fileName}</div>
                    <div className="mt-1 text-xs text-zinc-500">{humanDate(upload.uploadedAt)}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge className="border-white/10 bg-white/10 text-zinc-200">{formatNumber(upload.report?.summary?.totalEntries)} entries</Badge>
                      <Badge className="border-white/10 bg-white/10 text-zinc-200">{formatNumber(upload.report?.summary?.uniquePlayers)} players</Badge>
                    </div>
                  </button>
                ))}
                {!uploadHistory.length && (
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
                    No uploaded risk player reports yet.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {summaryCard('Risk Entries', formatNumber(summary.totalEntries), ShieldAlert, 'text-red-300')}
            {summaryCard('Unique Players', formatNumber(summary.uniquePlayers), AlertTriangle, 'text-amber-300')}
            {summaryCard('Ignored Confirms', formatNumber(summary.ignoredCompletions), FileText, 'text-emerald-300')}
            {summaryCard('Uploaded', humanDate(localReport?.uploadedAt || selectedUpload?.uploadedAt), Upload, 'text-cyan-300')}
          </div>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                <span>Top Recurring Rule Breakers</span>
                <Badge className="border-white/10 bg-white/10 text-zinc-200">{localReport?.fileName || selectedUpload?.fileName || 'No file loaded'}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topPlayers.map((player, index) => (
                <div key={player.key} className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={index < 3 ? 'border-red-400/40 bg-red-500/14 text-red-100' : 'border-amber-400/35 bg-amber-500/12 text-amber-100'}>#{index + 1}</Badge>
                        <Badge className="border-white/10 bg-white/10 text-zinc-200">{formatNumber(player.entryCount)} entries</Badge>
                        <Badge className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">{formatNumber(player.totalActions)} actions</Badge>
                      </div>
                      <div className="mt-3 text-lg font-semibold text-white">{player.playerName}</div>
                      <div className="mt-1 text-xs text-zinc-500">{player.license || 'No license captured'}{player.playerDiscord ? ` / @${player.playerDiscord}` : ''}</div>
                    </div>
                    <div className="max-w-xl text-right text-sm text-zinc-300">
                      <div className="font-medium text-white">{player.topReason}</div>
                      <div className="mt-1 text-xs text-zinc-500">Latest: {player.latestTimestamp || 'Unknown'}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {player.entries.slice(-4).reverse().map(entry => (
                      <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-zinc-300">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-white">{entry.reason}</span>
                          <span className="text-xs text-zinc-500">{entry.actions} actions</span>
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">{entry.timestamp} / {entry.staffMember}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!topPlayers.length && (
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-zinc-400">
                  Upload a community-service TXT export to generate the recurring risk list.
                </div>
              )}
            </CardContent>
          </Card>

          {!!allPlayers.length && (
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>All Flagged Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {allPlayers.map(player => (
                    <div key={player.key} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <div className="text-sm font-semibold text-white">{player.playerName}</div>
                      <div className="mt-1 text-xs text-zinc-500">{formatNumber(player.entryCount)} entries / {formatNumber(player.totalActions)} actions</div>
                      <div className="mt-2 line-clamp-2 text-xs text-zinc-400">{player.topReason}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
