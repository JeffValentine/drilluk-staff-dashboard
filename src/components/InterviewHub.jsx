import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const compactPrimaryButton = 'h-10 rounded-[18px] border px-4 text-sm font-semibold shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition hover:-translate-y-[1px]';
const premiumActionBase = 'h-10 rounded-[18px] border px-3.5 text-sm font-semibold shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition hover:-translate-y-[1px]';

function statusBadgeClass(status) {
  if (status === 'accepted') return 'border-emerald-400/35 bg-emerald-500/12 text-emerald-100';
  if (status === 'rejected') return 'border-red-400/35 bg-red-500/12 text-red-100';
  if (status === 'reviewed') return 'border-cyan-400/35 bg-cyan-500/12 text-cyan-100';
  return 'border-amber-400/35 bg-amber-500/12 text-amber-100';
}

function emptyTemplateDraft(item = null) {
  return {
    id: item?.id || '',
    section: item?.section || 'Rules & Situational Knowledge',
    question: item?.question || '',
    maxScore: String(item?.maxScore || 5),
    sortOrder: String(item?.sortOrder || 10),
    goodAnswerExample: item?.goodAnswerExample || '',
    badAnswerExample: item?.badAnswerExample || '',
  };
}

export default function InterviewHub({
  interviews,
  selectedInterviewId,
  setSelectedInterviewId,
  reviewNotes,
  setReviewNotes,
  interviewQuery,
  setInterviewQuery,
  questionBank,
  canEditTemplate,
  onRefresh,
  onUpdateStatus,
  onSaveInterviewScorecard,
  onSaveTemplateQuestion,
  onDeleteTemplateQuestion,
}) {
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [scoreDrafts, setScoreDrafts] = useState({});
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState(emptyTemplateDraft());

  const filtered = useMemo(() => {
    const q = interviewQuery.trim().toLowerCase();
    if (!q) return interviews;
    return interviews.filter((item) => {
      const haystack = [item.full_name, item.discord_name, item.country, item.status].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [interviews, interviewQuery]);

  const selected = filtered.find((item) => item.id === selectedInterviewId) || interviews.find((item) => item.id === selectedInterviewId) || filtered[0] || interviews[0] || null;
  const activeQuestions = useMemo(() => [...(questionBank || [])].filter((item) => item.isActive !== false), [questionBank]);
  const groupedQuestions = useMemo(() => {
    const groups = new Map();
    activeQuestions.forEach((item) => {
      if (!groups.has(item.section)) groups.set(item.section, []);
      groups.get(item.section).push(item);
    });
    return Array.from(groups.entries()).map(([section, items]) => ({ section, items }));
  }, [activeQuestions]);

  useEffect(() => {
    if (!selected) return;
    setReviewNotes(selected.review_notes || '');
    const drafts = {};
    (selected.interview_scores || []).forEach((item) => {
      if (!item?.questionId) return;
      drafts[item.questionId] = {
        score: String(item.score ?? ''),
        notes: item.notes || '',
      };
    });
    setScoreDrafts(drafts);
  }, [selected?.id]);

  const totals = useMemo(() => {
    return groupedQuestions.map((group) => {
      const max = group.items.reduce((sum, item) => sum + Number(item.maxScore || 0), 0);
      const score = group.items.reduce((sum, item) => sum + Number(scoreDrafts[item.id]?.score || 0), 0);
      return { section: group.section, score, max };
    });
  }, [groupedQuestions, scoreDrafts]);

  const grandTotal = totals.reduce((sum, item) => sum + item.score, 0);
  const grandMax = totals.reduce((sum, item) => sum + item.max, 0);

  function openTemplateEditor(item = null) {
    setTemplateDraft(emptyTemplateDraft(item));
    setTemplateEditorOpen(true);
  }

  async function saveTemplate() {
    await onSaveTemplateQuestion({
      id: templateDraft.id || null,
      section: templateDraft.section,
      question: templateDraft.question,
      maxScore: Number(templateDraft.maxScore || 5),
      sortOrder: Number(templateDraft.sortOrder || 10),
      goodAnswerExample: templateDraft.goodAnswerExample,
      badAnswerExample: templateDraft.badAnswerExample,
    });
    setTemplateEditorOpen(false);
  }

  async function saveInterview() {
    if (!selected) return;
    const scorecard = activeQuestions.map((item) => ({
      questionId: item.id,
      section: item.section,
      question: item.question,
      maxScore: Number(item.maxScore || 0),
      score: Number(scoreDrafts[item.id]?.score || 0),
      notes: scoreDrafts[item.id]?.notes || '',
    }));
    await onSaveInterviewScorecard(selected, scorecard, { total: grandTotal, max: grandMax });
  }

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
          <Button onClick={onRefresh} className={`w-full ${premiumActionBase} border-cyan-400/35 bg-[linear-gradient(135deg,rgba(8,145,178,0.28),rgba(34,211,238,0.14))] text-cyan-50 hover:bg-[linear-gradient(135deg,rgba(8,145,178,0.36),rgba(34,211,238,0.2))]`}>
            Refresh Applications
          </Button>
          <div className="max-h-[calc(100vh-300px)] space-y-3 overflow-y-auto pr-1">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedInterviewId(item.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${selected?.id === item.id ? 'border-fuchsia-500/45 bg-fuchsia-500/12' : 'border-white/10 bg-black/25 hover:bg-white/5'}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-white">{item.full_name}</div>
                  <Badge className={statusBadgeClass(item.status)}>{item.status}</Badge>
                </div>
                <div className="mt-2 text-sm text-zinc-400">{item.discord_name}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                  {Number(item.interview_total_score || 0) > 0 && <span>{item.interview_total_score}/{item.interview_max_score || 0} points</span>}
                </div>
              </button>
            ))}
            {!filtered.length && <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">No interview applications found.</div>}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {!selected && (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6 text-sm text-zinc-400">Select an applicant to review their details and start the scored interview.</CardContent>
          </Card>
        )}

        {selected && (
          <>
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <span>{selected.full_name}</span>
                  <Badge className={statusBadgeClass(selected.status)}>{selected.status}</Badge>
                  {Number(selected.interview_total_score || 0) > 0 && (
                    <Badge className="border-emerald-400/35 bg-emerald-500/12 text-emerald-100">
                      {selected.interview_total_score}/{selected.interview_max_score || grandMax} points
                    </Badge>
                  )}
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
                <CardTitle>Interview Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  placeholder="Head Admin notes for this applicant"
                  className="min-h-[120px] border-white/10 bg-black/30 text-white placeholder:text-zinc-500"
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setInterviewOpen(true)} className={`${compactPrimaryButton} border-fuchsia-400/35 bg-[linear-gradient(135deg,rgba(8,145,178,0.2),rgba(217,70,239,0.16))] text-white hover:bg-[linear-gradient(135deg,rgba(8,145,178,0.28),rgba(217,70,239,0.22))] whitespace-nowrap`}>
                    {selected.interview_started_at ? 'Resume Interview' : 'Start Interview'}
                  </Button>
                  <Button onClick={() => onUpdateStatus(selected, 'reviewed')} className={`${premiumActionBase} border-fuchsia-400/35 bg-[linear-gradient(135deg,rgba(8,145,178,0.2),rgba(217,70,239,0.16))] text-white hover:bg-[linear-gradient(135deg,rgba(8,145,178,0.28),rgba(217,70,239,0.22))]`}>Mark Reviewed</Button>
                  <Button onClick={() => onUpdateStatus(selected, 'accepted')} className={`${premiumActionBase} border-fuchsia-400/35 bg-[linear-gradient(135deg,rgba(8,145,178,0.2),rgba(217,70,239,0.16))] text-white hover:bg-[linear-gradient(135deg,rgba(8,145,178,0.28),rgba(217,70,239,0.22))]`}>Accept</Button>
                  <Button onClick={() => onUpdateStatus(selected, 'rejected')} className={`${premiumActionBase} border-fuchsia-400/35 bg-[linear-gradient(135deg,rgba(8,145,178,0.2),rgba(217,70,239,0.16))] text-white hover:bg-[linear-gradient(135deg,rgba(8,145,178,0.28),rgba(217,70,239,0.22))]`}>Reject</Button>
                  {canEditTemplate && (
                    <Button onClick={() => openTemplateEditor()} className={`${premiumActionBase} border-fuchsia-400/35 bg-[linear-gradient(135deg,rgba(8,145,178,0.2),rgba(217,70,239,0.16))] text-white hover:bg-[linear-gradient(135deg,rgba(8,145,178,0.28),rgba(217,70,239,0.22))]`}>Edit Interview Template</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {interviewOpen && (
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Live Point Interview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-3">
                    {totals.map((item) => (
                      <div key={item.section} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{item.section}</div>
                        <div className="mt-2 text-lg font-semibold text-white">{item.score}/{item.max}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">Overall</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{grandTotal}/{grandMax}</div>
                  </div>
                  {groupedQuestions.map((group) => (
                    <div key={group.section} className="space-y-3 rounded-3xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-base font-semibold text-white">{group.section}</div>
                        <Badge className="border-white/10 bg-white/10 text-zinc-200">
                          {totals.find((item) => item.section === group.section)?.score || 0}/{totals.find((item) => item.section === group.section)?.max || 0}
                        </Badge>
                      </div>
                      {group.items.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-white">{item.question}</div>
                            <Badge className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">Max {item.maxScore}</Badge>
                          </div>
                          <div className="mt-3 grid gap-3 xl:grid-cols-[160px,1fr]">
                            <div>
                              <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">Score</div>
                              <select
                                value={scoreDrafts[item.id]?.score || ''}
                                onChange={(event) => setScoreDrafts((prev) => ({ ...prev, [item.id]: { score: event.target.value, notes: prev[item.id]?.notes || '' } }))}
                                className="h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white"
                              >
                                <option value="">Select</option>
                                {Array.from({ length: Number(item.maxScore || 0) + 1 }, (_, index) => index).map((score) => (
                                  <option key={`${item.id}-${score}`} value={String(score)}>{score}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">Interview notes</div>
                              <Textarea
                                value={scoreDrafts[item.id]?.notes || ''}
                                onChange={(event) => setScoreDrafts((prev) => ({ ...prev, [item.id]: { score: prev[item.id]?.score || '', notes: event.target.value } }))}
                                placeholder="Why this score was given"
                                className="min-h-[96px] border-white/10 bg-black/30 text-white placeholder:text-zinc-500"
                              />
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3 xl:grid-cols-2">
                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">Good answer example</div><div className="mt-2 text-sm leading-6 text-zinc-100">{item.goodAnswerExample}</div></div>
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-red-200">Bad answer example</div><div className="mt-2 text-sm leading-6 text-zinc-100">{item.badAnswerExample}</div></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="grid gap-3 md:grid-cols-[1fr,220px]">
                    <Button onClick={saveInterview} className={`${premiumActionBase} border-emerald-400/35 bg-[linear-gradient(135deg,rgba(5,150,105,0.32),rgba(16,185,129,0.18))] text-emerald-50 hover:bg-[linear-gradient(135deg,rgba(5,150,105,0.4),rgba(16,185,129,0.24))]`}>Save Interview Scorecard</Button>
                    <Button onClick={() => setInterviewOpen(false)} className={`${premiumActionBase} border-white/15 bg-[linear-gradient(135deg,rgba(39,39,42,0.9),rgba(17,24,39,0.86))] text-zinc-50 hover:bg-[linear-gradient(135deg,rgba(63,63,70,0.92),rgba(31,41,55,0.9))]`}>Close Interview</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {templateEditorOpen && canEditTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-white/15 bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(10,10,15,0.98))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.5)]">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-lg font-semibold text-white">Interview Template Editor</div>
                <div className="mt-1 text-sm text-zinc-400">Developer-only control for interview questions, scoring limits, and answer guidance.</div>
              </div>
              <button type="button" onClick={() => setTemplateEditorOpen(false)} className="rounded-2xl border border-white/10 bg-black/25 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white">Close</button>
            </div>
            <div className="grid gap-5 xl:grid-cols-[0.9fr,1.1fr]">
              <div className="space-y-3">
                {(questionBank || []).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{item.section}</div>
                    <div className="mt-2 text-sm font-semibold text-white">{item.question}</div>
                    <div className="mt-2 text-xs text-zinc-500">Max {item.maxScore} - order {item.sortOrder}</div>
                    <div className="mt-3 flex gap-2">
                      <Button onClick={() => openTemplateEditor(item)} className={`${premiumActionBase} min-h-10 border-cyan-400/35 bg-[linear-gradient(135deg,rgba(8,145,178,0.28),rgba(34,211,238,0.14))] text-cyan-50 hover:bg-[linear-gradient(135deg,rgba(8,145,178,0.36),rgba(34,211,238,0.2))]`}>Edit</Button>
                      <Button onClick={() => onDeleteTemplateQuestion(item)} className={`${premiumActionBase} min-h-10 border-red-400/35 bg-[linear-gradient(135deg,rgba(185,28,28,0.3),rgba(248,113,113,0.16))] text-red-50 hover:bg-[linear-gradient(135deg,rgba(185,28,28,0.38),rgba(248,113,113,0.24))]`}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-4">
                <div className="text-lg font-semibold text-white">{templateDraft.id ? 'Edit question' : 'Add question'}</div>
                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">Section</div>
                  <Input value={templateDraft.section} onChange={(event) => setTemplateDraft((prev) => ({ ...prev, section: event.target.value }))} className="border-white/10 bg-black/30 text-white" />
                </div>
                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">Question</div>
                  <Textarea value={templateDraft.question} onChange={(event) => setTemplateDraft((prev) => ({ ...prev, question: event.target.value }))} className="min-h-[110px] border-white/10 bg-black/30 text-white" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">Max score</div>
                    <Input type="number" value={templateDraft.maxScore} onChange={(event) => setTemplateDraft((prev) => ({ ...prev, maxScore: event.target.value }))} className="border-white/10 bg-black/30 text-white" />
                  </div>
                  <div>
                    <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">Sort order</div>
                    <Input type="number" value={templateDraft.sortOrder} onChange={(event) => setTemplateDraft((prev) => ({ ...prev, sortOrder: event.target.value }))} className="border-white/10 bg-black/30 text-white" />
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">Good answer example</div>
                  <Textarea value={templateDraft.goodAnswerExample} onChange={(event) => setTemplateDraft((prev) => ({ ...prev, goodAnswerExample: event.target.value }))} className="min-h-[100px] border-white/10 bg-black/30 text-white" />
                </div>
                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">Bad answer example</div>
                  <Textarea value={templateDraft.badAnswerExample} onChange={(event) => setTemplateDraft((prev) => ({ ...prev, badAnswerExample: event.target.value }))} className="min-h-[100px] border-white/10 bg-black/30 text-white" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button onClick={saveTemplate} className={`${premiumActionBase} border-emerald-400/35 bg-[linear-gradient(135deg,rgba(5,150,105,0.32),rgba(16,185,129,0.18))] text-emerald-50 hover:bg-[linear-gradient(135deg,rgba(5,150,105,0.4),rgba(16,185,129,0.24))]`}>Save Question</Button>
                  <Button onClick={() => setTemplateDraft(emptyTemplateDraft())} className={`${premiumActionBase} border-white/15 bg-[linear-gradient(135deg,rgba(39,39,42,0.9),rgba(17,24,39,0.86))] text-zinc-50 hover:bg-[linear-gradient(135deg,rgba(63,63,70,0.92),rgba(31,41,55,0.9))]`}>New Blank</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

