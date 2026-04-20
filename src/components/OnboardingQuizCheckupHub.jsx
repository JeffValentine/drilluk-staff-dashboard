import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function formatDateTime(value) {
  if (!value) return 'No timestamp';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No timestamp';
  return date.toLocaleString();
}

function reviewBadgeClass(status, passed) {
  if (status === 'approved') return 'border-emerald-500/35 bg-emerald-500/12 text-emerald-100';
  if (status === 'needs_retake') return 'border-red-500/35 bg-red-500/12 text-red-100';
  if (passed) return 'border-amber-500/35 bg-amber-500/12 text-amber-100';
  return 'border-cyan-400/35 bg-cyan-500/12 text-cyan-100';
}

function reviewLabel(status, passed) {
  if (status === 'approved') return 'Approved';
  if (status === 'needs_retake') return 'Retake';
  if (passed) return 'Pending Review';
  return 'Submitted';
}

function buildStaffSummary(quizAttempts) {
  const map = new Map();
  quizAttempts.forEach((attempt) => {
    const key = String(attempt.staffId || attempt.staffName || attempt.title || Math.random());
    if (!map.has(key)) {
      map.set(key, {
        key,
        staffName: attempt.staffName || 'Unknown staff member',
        staffRole: attempt.staffRole || '',
        attempts: [],
      });
    }
    map.get(key).attempts.push(attempt);
  });

  return Array.from(map.values())
    .map((entry) => {
      const attemptsSorted = [...entry.attempts].sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime());
      return {
        ...entry,
        attempts: attemptsSorted,
        total: attemptsSorted.length,
        passed: attemptsSorted.filter(item => item.passed).length,
        latestAt: attemptsSorted[0]?.at || null,
        quizTitles: Array.from(new Set(attemptsSorted.map(item => item.title || item.quizKey || 'Quiz attempt'))),
      };
    })
    .sort((a, b) => new Date(b.latestAt || 0).getTime() - new Date(a.latestAt || 0).getTime());
}

function buildQuizSummary(quizAttempts) {
  const map = new Map();
  quizAttempts.forEach((attempt) => {
    const key = attempt.title || attempt.quizKey || 'Quiz attempt';
    if (!map.has(key)) {
      map.set(key, {
        key,
        title: key,
        attempts: [],
      });
    }
    map.get(key).attempts.push(attempt);
  });

  return Array.from(map.values())
    .map((entry) => {
      const attemptsSorted = [...entry.attempts].sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime());
      return {
        ...entry,
        total: attemptsSorted.length,
        passed: attemptsSorted.filter(item => item.passed).length,
        latestAt: attemptsSorted[0]?.at || null,
        staffNames: Array.from(new Set(attemptsSorted.map(item => item.staffName || 'Unknown'))),
      };
    })
    .sort((a, b) => b.total - a.total || new Date(b.latestAt || 0).getTime() - new Date(a.latestAt || 0).getTime());
}

function inPeriod(value, startExclusive, endInclusive) {
  const ts = new Date(value || 0).getTime();
  if (!Number.isFinite(ts)) return false;
  const startTs = startExclusive ? new Date(startExclusive).getTime() : null;
  const endTs = endInclusive ? new Date(endInclusive).getTime() : null;
  if (startTs !== null && Number.isFinite(startTs) && ts <= startTs) return false;
  if (endTs !== null && Number.isFinite(endTs) && ts > endTs) return false;
  return true;
}

function SectionTable({ columns, rows, emptyLabel, maxHeight = 'max-h-[520px]' }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
      <div className={`grid ${columns.map(column => column.width).join(' ')} gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500`}>
        {columns.map(column => <div key={column.label}>{column.label}</div>)}
      </div>
      <div className={`${maxHeight} overflow-y-auto`}>
        {!rows.length && <div className="px-4 py-4 text-sm text-zinc-400">{emptyLabel}</div>}
        {rows}
      </div>
    </div>
  );
}

export default function OnboardingQuizCheckupHub({
  lastCheckup = null,
  newStaff = [],
  quizAttempts = [],
  checkupHistory = [],
  canMarkCheckup = false,
  markingCheckup = false,
  onMarkCheckup,
}) {
  const [selectedHistoryId, setSelectedHistoryId] = useState('');

  const uniqueStaffCount = useMemo(
    () => new Set(quizAttempts.map(item => String(item.staffId || item.staffName || '')).filter(Boolean)).size,
    [quizAttempts]
  );

  const passedCount = useMemo(
    () => quizAttempts.filter(item => item.passed).length,
    [quizAttempts]
  );

  const groupedByStaff = useMemo(() => buildStaffSummary(quizAttempts), [quizAttempts]);
  const groupedByQuiz = useMemo(() => buildQuizSummary(quizAttempts), [quizAttempts]);

  const summaryCards = [
    { label: 'New Staff', value: newStaff.length },
    { label: 'Quiz Submissions', value: quizAttempts.length },
    { label: 'Passed', value: passedCount },
    { label: 'Staff Active', value: uniqueStaffCount },
    { label: 'Quiz Types', value: groupedByQuiz.length },
  ];

  useEffect(() => {
    if (!checkupHistory.length) {
      setSelectedHistoryId('');
      return;
    }
    if (!selectedHistoryId || !checkupHistory.some(item => item.id === selectedHistoryId)) {
      setSelectedHistoryId(checkupHistory[0].id);
    }
  }, [checkupHistory, selectedHistoryId]);

  const selectedHistoryEntry = useMemo(
    () => checkupHistory.find(item => item.id === selectedHistoryId) || checkupHistory[0] || null,
    [checkupHistory, selectedHistoryId]
  );

  const selectedHistoryStaffSummary = useMemo(
    () => buildStaffSummary(selectedHistoryEntry?.quizAttempts || []),
    [selectedHistoryEntry]
  );

  const selectedHistoryQuizSummary = useMemo(
    () => buildQuizSummary(selectedHistoryEntry?.quizAttempts || []),
    [selectedHistoryEntry]
  );

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-white">Staff onboarding and Quiz completion</div>
              <div className="mt-1 text-sm text-zinc-400">
                {lastCheckup?.created_at
                  ? `Tracking activity since ${formatDateTime(lastCheckup.created_at)}${lastCheckup.actorLabel ? ` by ${lastCheckup.actorLabel}` : ''}.`
                  : 'No check up has been marked yet. Showing all recorded activity.'}
              </div>
            </div>
            {canMarkCheckup && (
              <Button
                type="button"
                onClick={onMarkCheckup}
                disabled={markingCheckup}
                className="rounded-2xl border border-emerald-400/35 bg-[linear-gradient(135deg,rgba(5,10,20,0.96),rgba(5,150,105,0.18),rgba(6,78,59,0.24))] text-emerald-50 hover:bg-[linear-gradient(135deg,rgba(10,16,28,0.98),rgba(5,150,105,0.24),rgba(6,78,59,0.3))]"
              >
                {markingCheckup ? 'Saving Check Up...' : 'Check Up'}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{card.label}</div>
              <div className="mt-2 text-3xl font-semibold text-white">{card.value}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>New Staff Onboarded</span>
              <Badge className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">{newStaff.length} entries</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SectionTable
              columns={[
                { label: 'Name', width: 'grid-cols-[1.2fr,0.8fr,1fr,0.9fr]' },
                { label: 'Role', width: '' },
                { label: 'Trainer', width: '' },
                { label: 'Added', width: '' },
              ]}
              rows={newStaff.map((member) => (
                <div key={`onboard-${member.id}`} className="grid grid-cols-[1.2fr,0.8fr,1fr,0.9fr] gap-3 border-b border-white/5 px-4 py-3 text-sm text-zinc-200 last:border-b-0">
                  <div className="font-semibold text-white">{member.name}</div>
                  <div>{member.role}</div>
                  <div>{member.trainer || 'Unassigned'}</div>
                  <div className="text-zinc-400">{formatDateTime(member.createdAt || member.staffSince)}</div>
                </div>
              ))}
              emptyLabel="No new staff have been onboarded in this period."
            />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Quiz Completion By Staff</span>
              <Badge className="border-fuchsia-400/35 bg-fuchsia-500/12 text-fuchsia-100">{groupedByStaff.length} staff</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SectionTable
              columns={[
                { label: 'Staff', width: 'grid-cols-[1.2fr,0.7fr,0.7fr,1.5fr,0.9fr]' },
                { label: 'Total', width: '' },
                { label: 'Passed', width: '' },
                { label: 'Quizzes', width: '' },
                { label: 'Latest', width: '' },
              ]}
              rows={groupedByStaff.map((entry) => (
                <div key={entry.key} className="grid grid-cols-[1.2fr,0.7fr,0.7fr,1.5fr,0.9fr] gap-3 border-b border-white/5 px-4 py-3 text-sm text-zinc-200 last:border-b-0">
                  <div>
                    <div className="font-semibold text-white">{entry.staffName}</div>
                    <div className="text-xs text-zinc-500">{entry.staffRole || 'No role set'}</div>
                  </div>
                  <div className="font-semibold text-white">{entry.total}</div>
                  <div className="font-semibold text-emerald-100">{entry.passed}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.quizTitles.slice(0, 3).map((title) => (
                      <Badge key={`${entry.key}-${title}`} className="border-white/10 bg-white/10 text-zinc-200">{title}</Badge>
                    ))}
                    {entry.quizTitles.length > 3 && <Badge className="border-white/10 bg-white/10 text-zinc-400">+{entry.quizTitles.length - 3} more</Badge>}
                  </div>
                  <div className="text-zinc-400">{formatDateTime(entry.latestAt)}</div>
                </div>
              ))}
              emptyLabel="No quiz submissions have been logged in this period."
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Detailed Quiz Activity</span>
              <Badge className="border-amber-400/35 bg-amber-500/12 text-amber-100">{quizAttempts.length} rows</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SectionTable
              columns={[
                { label: 'When', width: 'grid-cols-[0.9fr,1fr,1.3fr,0.55fr,0.8fr]' },
                { label: 'Staff', width: '' },
                { label: 'Quiz', width: '' },
                { label: 'Score', width: '' },
                { label: 'Status', width: '' },
              ]}
              rows={quizAttempts.map((attempt) => (
                <div key={`attempt-${attempt.id}-${attempt.staffId || attempt.staffName}`} className="grid grid-cols-[0.9fr,1fr,1.3fr,0.55fr,0.8fr] gap-3 border-b border-white/5 px-4 py-3 text-sm text-zinc-200 last:border-b-0">
                  <div className="text-zinc-400">{formatDateTime(attempt.at)}</div>
                  <div>
                    <div className="font-semibold text-white">{attempt.staffName || 'Unknown staff member'}</div>
                    <div className="text-xs text-zinc-500">{attempt.staffRole || 'No role set'}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{attempt.title || attempt.quizKey || 'Quiz attempt'}</div>
                    {attempt.reviewNote && <div className="mt-1 text-xs text-zinc-500">{attempt.reviewNote}</div>}
                  </div>
                  <div className="font-semibold text-white">{Number(attempt.score || 0)}%</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={reviewBadgeClass(attempt.reviewStatus, attempt.passed)}>{reviewLabel(attempt.reviewStatus, attempt.passed)}</Badge>
                    {/staff team overview/i.test(String(attempt.reviewNote || '')) && <Badge className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">Manual</Badge>}
                  </div>
                </div>
              ))}
              emptyLabel="No quiz activity has been recorded in this period."
              maxHeight="max-h-[620px]"
            />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Quiz Breakdown</span>
              <Badge className="border-emerald-400/35 bg-emerald-500/12 text-emerald-100">{groupedByQuiz.length} quiz types</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SectionTable
              columns={[
                { label: 'Quiz', width: 'grid-cols-[1.35fr,0.55fr,0.55fr,1fr]' },
                { label: 'Total', width: '' },
                { label: 'Passed', width: '' },
                { label: 'Completed By', width: '' },
              ]}
              rows={groupedByQuiz.map((entry) => (
                <div key={`quiz-group-${entry.key}`} className="grid grid-cols-[1.35fr,0.55fr,0.55fr,1fr] gap-3 border-b border-white/5 px-4 py-3 text-sm text-zinc-200 last:border-b-0">
                  <div>
                    <div className="font-semibold text-white">{entry.title}</div>
                    <div className="text-xs text-zinc-500">Latest {formatDateTime(entry.latestAt)}</div>
                  </div>
                  <div className="font-semibold text-white">{entry.total}</div>
                  <div className="font-semibold text-emerald-100">{entry.passed}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.staffNames.slice(0, 4).map((name) => (
                      <Badge key={`${entry.key}-${name}`} className="border-white/10 bg-white/10 text-zinc-200">{name}</Badge>
                    ))}
                    {entry.staffNames.length > 4 && <Badge className="border-white/10 bg-white/10 text-zinc-400">+{entry.staffNames.length - 4} more</Badge>}
                  </div>
                </div>
              ))}
              emptyLabel="No quiz types have been completed in this period."
              maxHeight="max-h-[620px]"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.82fr,1.18fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Check up log history</span>
              <Badge className="border-white/10 bg-white/10 text-zinc-200">{checkupHistory.length} logs</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!checkupHistory.length && <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">No previous check ups have been logged yet.</div>}
            <div className="max-h-[760px] space-y-3 overflow-y-auto pr-1">
              {checkupHistory.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedHistoryId(entry.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selectedHistoryEntry?.id === entry.id ? 'border-fuchsia-500/45 bg-fuchsia-500/12' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">{formatDateTime(entry.created_at)}</Badge>
                    <Badge className="border-white/10 bg-white/10 text-zinc-200">{entry.actorLabel || 'Unknown actor'}</Badge>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Onboarded Staff</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{entry.onboardedCount}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Passed Attempts</div>
                      <div className="mt-2 text-2xl font-semibold text-emerald-100">{entry.passedQuizAttemptCount}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">All Attempts</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{entry.quizAttemptCount}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <div>
                <div>Check up details</div>
                <div className="mt-1 text-sm font-normal text-zinc-400">
                  {selectedHistoryEntry
                    ? `Showing the activity captured in the ${formatDateTime(selectedHistoryEntry.created_at)} check up.`
                    : 'Select a previous check up to inspect what was inside it.'}
                </div>
              </div>
              {selectedHistoryEntry && <Badge className="border-fuchsia-400/35 bg-fuchsia-500/12 text-fuchsia-100">{selectedHistoryEntry.actorLabel || 'Unknown actor'}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedHistoryEntry ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">No previous check up selected.</div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Check up at</div>
                    <div className="mt-2 text-sm font-semibold text-white">{formatDateTime(selectedHistoryEntry.created_at)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Period start</div>
                    <div className="mt-2 text-sm font-semibold text-white">{selectedHistoryEntry.startAt ? formatDateTime(selectedHistoryEntry.startAt) : 'Start of records'}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Onboarded staff</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{selectedHistoryEntry.onboardedCount}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Passed attempts</div>
                    <div className="mt-2 text-2xl font-semibold text-emerald-100">{selectedHistoryEntry.passedQuizAttemptCount}</div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
                  <Card className="border-white/10 bg-black/20">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-3">
                        <span>Onboarded in this check up</span>
                        <Badge className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">{selectedHistoryEntry.newStaff.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SectionTable
                        columns={[
                          { label: 'Name', width: 'grid-cols-[1.1fr,0.8fr,0.9fr]' },
                          { label: 'Role', width: '' },
                          { label: 'Added', width: '' },
                        ]}
                        rows={selectedHistoryEntry.newStaff.map((member) => (
                          <div key={`history-staff-${member.id}`} className="grid grid-cols-[1.1fr,0.8fr,0.9fr] gap-3 border-b border-white/5 px-4 py-3 text-sm text-zinc-200 last:border-b-0">
                            <div className="font-semibold text-white">{member.name}</div>
                            <div>{member.role}</div>
                            <div className="text-zinc-400">{formatDateTime(member.createdAt || member.staffSince)}</div>
                          </div>
                        ))}
                        emptyLabel="No staff were onboarded in this check up."
                        maxHeight="max-h-[320px]"
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-black/20">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-3">
                        <span>Quiz completions by staff</span>
                        <Badge className="border-fuchsia-400/35 bg-fuchsia-500/12 text-fuchsia-100">{selectedHistoryStaffSummary.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SectionTable
                        columns={[
                          { label: 'Staff', width: 'grid-cols-[1.2fr,0.6fr,0.6fr,1.2fr]' },
                          { label: 'Total', width: '' },
                          { label: 'Passed', width: '' },
                          { label: 'Quizzes', width: '' },
                        ]}
                        rows={selectedHistoryStaffSummary.map((entry) => (
                          <div key={`history-summary-${entry.key}`} className="grid grid-cols-[1.2fr,0.6fr,0.6fr,1.2fr] gap-3 border-b border-white/5 px-4 py-3 text-sm text-zinc-200 last:border-b-0">
                            <div>
                              <div className="font-semibold text-white">{entry.staffName}</div>
                              <div className="text-xs text-zinc-500">{entry.staffRole || 'No role set'}</div>
                            </div>
                            <div className="font-semibold text-white">{entry.total}</div>
                            <div className="font-semibold text-emerald-100">{entry.passed}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {entry.quizTitles.slice(0, 2).map((title) => <Badge key={`${entry.key}-${title}`} className="border-white/10 bg-white/10 text-zinc-200">{title}</Badge>)}
                              {entry.quizTitles.length > 2 && <Badge className="border-white/10 bg-white/10 text-zinc-400">+{entry.quizTitles.length - 2} more</Badge>}
                            </div>
                          </div>
                        ))}
                        emptyLabel="No quiz completions were recorded in this check up."
                        maxHeight="max-h-[320px]"
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
                  <Card className="border-white/10 bg-black/20">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-3">
                        <span>Detailed quiz log</span>
                        <Badge className="border-amber-400/35 bg-amber-500/12 text-amber-100">{selectedHistoryEntry.quizAttempts.length} rows</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SectionTable
                        columns={[
                          { label: 'When', width: 'grid-cols-[0.95fr,0.95fr,1.2fr,0.55fr,0.85fr]' },
                          { label: 'Staff', width: '' },
                          { label: 'Quiz', width: '' },
                          { label: 'Score', width: '' },
                          { label: 'Status', width: '' },
                        ]}
                        rows={selectedHistoryEntry.quizAttempts.map((attempt) => (
                          <div key={`history-attempt-${attempt.id}-${attempt.staffId || attempt.staffName}`} className="grid grid-cols-[0.95fr,0.95fr,1.2fr,0.55fr,0.85fr] gap-3 border-b border-white/5 px-4 py-3 text-sm text-zinc-200 last:border-b-0">
                            <div className="text-zinc-400">{formatDateTime(attempt.at)}</div>
                            <div>
                              <div className="font-semibold text-white">{attempt.staffName || 'Unknown staff member'}</div>
                              <div className="text-xs text-zinc-500">{attempt.staffRole || 'No role set'}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-white">{attempt.title || attempt.quizKey || 'Quiz attempt'}</div>
                              {attempt.reviewNote && <div className="mt-1 text-xs text-zinc-500">{attempt.reviewNote}</div>}
                            </div>
                            <div className="font-semibold text-white">{Number(attempt.score || 0)}%</div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={reviewBadgeClass(attempt.reviewStatus, attempt.passed)}>{reviewLabel(attempt.reviewStatus, attempt.passed)}</Badge>
                              {/staff team overview/i.test(String(attempt.reviewNote || '')) && <Badge className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">Manual</Badge>}
                            </div>
                          </div>
                        ))}
                        emptyLabel="No detailed quiz attempts were logged in this check up."
                        maxHeight="max-h-[420px]"
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-black/20">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-3">
                        <span>Quiz breakdown in this check up</span>
                        <Badge className="border-emerald-400/35 bg-emerald-500/12 text-emerald-100">{selectedHistoryQuizSummary.length} quiz types</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SectionTable
                        columns={[
                          { label: 'Quiz', width: 'grid-cols-[1.2fr,0.6fr,0.6fr,1fr]' },
                          { label: 'Total', width: '' },
                          { label: 'Passed', width: '' },
                          { label: 'Completed By', width: '' },
                        ]}
                        rows={selectedHistoryQuizSummary.map((entry) => (
                          <div key={`history-quiz-${entry.key}`} className="grid grid-cols-[1.2fr,0.6fr,0.6fr,1fr] gap-3 border-b border-white/5 px-4 py-3 text-sm text-zinc-200 last:border-b-0">
                            <div>
                              <div className="font-semibold text-white">{entry.title}</div>
                              <div className="text-xs text-zinc-500">Latest {formatDateTime(entry.latestAt)}</div>
                            </div>
                            <div className="font-semibold text-white">{entry.total}</div>
                            <div className="font-semibold text-emerald-100">{entry.passed}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {entry.staffNames.slice(0, 4).map((name) => <Badge key={`${entry.key}-${name}`} className="border-white/10 bg-white/10 text-zinc-200">{name}</Badge>)}
                              {entry.staffNames.length > 4 && <Badge className="border-white/10 bg-white/10 text-zinc-400">+{entry.staffNames.length - 4} more</Badge>}
                            </div>
                          </div>
                        ))}
                        emptyLabel="No quiz types were completed in this check up."
                        maxHeight="max-h-[420px]"
                      />
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
