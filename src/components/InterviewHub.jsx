import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

function statusBadgeClass(status) {
  if (status === 'accepted') return 'border-emerald-400/35 bg-emerald-500/12 text-emerald-100';
  if (status === 'rejected') return 'border-red-400/35 bg-red-500/12 text-red-100';
  if (status === 'reviewed') return 'border-cyan-400/35 bg-cyan-500/12 text-cyan-100';
  return 'border-amber-400/35 bg-amber-500/12 text-amber-100';
}

function renderAttempt(attempt) {
  if (!attempt) return null;
  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-black/25 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-white">{attempt.title}</div>
        <Badge className={attempt.passed ? 'border-emerald-400/35 bg-emerald-500/12 text-emerald-100' : 'border-red-400/35 bg-red-500/12 text-red-100'}>
          {attempt.scorePercent}%
        </Badge>
        <Badge className="border-white/10 bg-white/10 text-zinc-200">{attempt.correctAnswers}/{attempt.totalQuestions} correct</Badge>
      </div>
      <div className="space-y-2">
        {(attempt.answers || []).map((answer, index) => (
          <div key={`${attempt.title}-${index}`} className={`rounded-2xl border px-3 py-3 text-sm ${answer.correct ? 'border-emerald-500/25 bg-emerald-500/8' : 'border-red-500/25 bg-red-500/8'}`}>
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{answer.category || 'Question'} - Question {index + 1}</div>
            <div className="mt-2 font-medium text-white">{answer.question}</div>
            <div className={`mt-2 ${answer.correct ? 'text-emerald-200' : 'text-red-200'}`}>Selected: {answer.selectedAnswer || 'No answer'}</div>
            {!answer.correct && <div className="mt-1 text-emerald-200">Correct: {answer.correctAnswer || 'No answer set'}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InterviewHub({
  interviews,
  selectedInterviewId,
  setSelectedInterviewId,
  reviewNotes,
  setReviewNotes,
  interviewQuery,
  setInterviewQuery,
  onRefresh,
  onUpdateStatus,
}) {
  const selected = interviews.find((item) => item.id === selectedInterviewId) || interviews[0] || null;
  const filtered = useMemo(() => {
    const q = interviewQuery.trim().toLowerCase();
    if (!q) return interviews;
    return interviews.filter((item) => {
      const haystack = [item.full_name, item.discord_name, item.country, item.status].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [interviews, interviewQuery]);

  return (
    <div className="grid gap-4 xl:grid-cols-[360px,1fr]">
      <Card className="border-white/10 bg-white/5 xl:sticky xl:top-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Interview Applicants</span>
            <Badge className="border-white/10 bg-white/10 text-zinc-200">{filtered.length} shown</Badge>
          </CardTitle>
          <Input
            value={interviewQuery}
            onChange={(event) => setInterviewQuery(event.target.value)}
            placeholder="Search applicants..."
            className="border-white/10 bg-black/30 text-white placeholder:text-zinc-500"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={onRefresh} className="w-full rounded-2xl border border-cyan-400/35 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18">
            Refresh Applications
          </Button>
          <div className="max-h-[calc(100vh-300px)] space-y-3 overflow-y-auto pr-1">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedInterviewId(item.id);
                  setReviewNotes(item.review_notes || '');
                }}
                className={`w-full rounded-2xl border p-4 text-left transition ${selected?.id === item.id ? 'border-fuchsia-500/45 bg-fuchsia-500/12' : 'border-white/10 bg-black/25 hover:bg-white/5'}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-white">{item.full_name}</div>
                  <Badge className={statusBadgeClass(item.status)}>{item.status}</Badge>
                </div>
                <div className="mt-2 text-sm text-zinc-400">{item.discord_name}</div>
                <div className="mt-2 text-xs text-zinc-500">{new Date(item.created_at).toLocaleString()}</div>
              </button>
            ))}
            {!filtered.length && <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">No interview applications found.</div>}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {!selected && (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6 text-sm text-zinc-400">Select an applicant to review their interview answers and quiz attempts.</CardContent>
          </Card>
        )}
        {selected && (
          <>
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <span>{selected.full_name}</span>
                  <Badge className={statusBadgeClass(selected.status)}>{selected.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Discord</div><div className="mt-2 text-sm text-white">{selected.discord_name}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Age</div><div className="mt-2 text-sm text-white">{selected.age}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Location</div><div className="mt-2 text-sm text-white">{selected.country}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Hours / week</div><div className="mt-2 text-sm text-white">{selected.hours_per_week}</div></div>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Prior bans</div><div className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-200">{selected.prior_bans || 'Not provided'}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Previous staff experience</div><div className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-200">{selected.staff_experience || 'Not provided'}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Why staff?</div><div className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-200">{selected.why_staff || 'Not provided'}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Why Drill UK?</div><div className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-200">{selected.why_drill || 'Not provided'}</div></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Interview Quizzes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderAttempt(selected.entry_quiz_result)}
                {renderAttempt(selected.core_quiz_result)}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Review Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  placeholder="Head Admin notes for this applicant"
                  className="min-h-[120px] border-white/10 bg-black/30 text-white placeholder:text-zinc-500"
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => onUpdateStatus(selected, 'reviewed')} className="rounded-2xl border border-cyan-400/35 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18">Mark Reviewed</Button>
                  <Button onClick={() => onUpdateStatus(selected, 'accepted')} className="rounded-2xl border border-emerald-400/35 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/18">Accept</Button>
                  <Button onClick={() => onUpdateStatus(selected, 'rejected')} className="rounded-2xl border border-red-400/35 bg-red-500/12 text-red-100 hover:bg-red-500/18">Reject</Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
