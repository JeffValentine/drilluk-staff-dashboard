import React, { useMemo } from 'react';
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

export default function OnboardingQuizCheckupHub({
  lastCheckup = null,
  newStaff = [],
  quizAttempts = [],
  canMarkCheckup = false,
  markingCheckup = false,
  onMarkCheckup,
}) {
  const uniqueStaffCount = useMemo(
    () => new Set(quizAttempts.map(item => String(item.staffId || item.staffName || '')).filter(Boolean)).size,
    [quizAttempts]
  );

  const passedCount = useMemo(
    () => quizAttempts.filter(item => item.passed).length,
    [quizAttempts]
  );

  const groupedByStaff = useMemo(() => {
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
  }, [quizAttempts]);

  const groupedByQuiz = useMemo(() => {
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
  }, [quizAttempts]);

  const summaryCards = [
    { label: 'New Staff', value: newStaff.length },
    { label: 'Quiz Submissions', value: quizAttempts.length },
    { label: 'Passed', value: passedCount },
    { label: 'Staff Active', value: uniqueStaffCount },
    { label: 'Quiz Types', value: groupedByQuiz.length },
  ];

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
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
              <div className="grid grid-cols-[1.2fr,0.8fr,1fr,0.9fr] gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                <div>Name</div>
                <div>Role</div>
                <div>Trainer</div>
                <div>Added</div>
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                {!newStaff.length && <div className="px-4 py-4 text-sm text-zinc-400">No new staff have been onboarded in this period.</div>}
                {newStaff.map((member) => (
                  <div key={`onboard-${member.id}`} className="grid grid-cols-[1.2fr,0.8fr,1fr,0.9fr] gap-3 border-b border-white/5 px-4 py-3 text-sm text-zinc-200 last:border-b-0">
                    <div className="font-semibold text-white">{member.name}</div>
                    <div>{member.role}</div>
                    <div>{member.trainer || 'Unassigned'}</div>
                    <div className="text-zinc-400">{formatDateTime(member.createdAt || member.staffSince)}</div>
                  </div>
                ))}
              </div>
            </div>
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
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
              <div className="grid grid-cols-[1.2fr,0.7fr,0.7fr,1.5fr,0.9fr] gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                <div>Staff</div>
                <div>Total</div>
                <div>Passed</div>
                <div>Quizzes</div>
                <div>Latest</div>
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                {!groupedByStaff.length && <div className="px-4 py-4 text-sm text-zinc-400">No quiz submissions have been logged in this period.</div>}
                {groupedByStaff.map((entry) => (
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
              </div>
            </div>
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
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
              <div className="grid grid-cols-[0.9fr,1fr,1.3fr,0.55fr,0.8fr] gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                <div>When</div>
                <div>Staff</div>
                <div>Quiz</div>
                <div>Score</div>
                <div>Status</div>
              </div>
              <div className="max-h-[620px] overflow-y-auto">
                {!quizAttempts.length && <div className="px-4 py-4 text-sm text-zinc-400">No quiz activity has been recorded in this period.</div>}
                {quizAttempts.map((attempt) => (
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
              </div>
            </div>
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
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
              <div className="grid grid-cols-[1.35fr,0.55fr,0.55fr,1fr] gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                <div>Quiz</div>
                <div>Total</div>
                <div>Passed</div>
                <div>Completed By</div>
              </div>
              <div className="max-h-[620px] overflow-y-auto">
                {!groupedByQuiz.length && <div className="px-4 py-4 text-sm text-zinc-400">No quiz types have been completed in this period.</div>}
                {groupedByQuiz.map((entry) => (
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
