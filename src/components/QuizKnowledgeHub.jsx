import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ExperimentalStaffQuiz from '@/components/ExperimentalStaffQuiz';

export default function QuizKnowledgeHub({
  quizDefinitions,
  selectedQuizKey,
  setSelectedQuizKey,
  selectedQuiz,
  canManageCheckboxes,
  onOpenBuilder,
  onEditQuizQuestion,
  onAddManagedQuestion,
  defaultName,
  rankBadgeClass,
  selectedStaff = null,
  isAssignedToSelected = false,
  onToggleAssignment = null,
  onQuizComplete = null,
}) {
  const [questionBankOpen, setQuestionBankOpen] = useState(false);

  useEffect(() => {
    if (!canManageCheckboxes) {
      setQuestionBankOpen(false);
    }
  }, [canManageCheckboxes]);

  function handleSelectQuiz(definition) {
    setSelectedQuizKey(definition.key);
    if (canManageCheckboxes) setQuestionBankOpen(true);
  }

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Quizzes & Knowledge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-fuchsia-500/35 bg-fuchsia-500/12 text-fuchsia-200">Knowledge Packs</Badge>
                <Badge className="border-white/10 bg-white/10 text-zinc-200">Rank-based, assigned, and managed quizzes</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                Quiz packs are organized by rank and category. Admins can inspect and edit the entire question bank from a modal, while trainees only see their own active path in My Progress.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Builder access</div>
              <div className="mt-2 text-sm text-zinc-300">Bulk editing stays available through the builder, but direct quiz edits and new managed quiz creation now happen from this workspace.</div>
              {canManageCheckboxes && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => onAddManagedQuestion?.(null)} className="rounded-2xl border border-emerald-400/35 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/18">
                    Create New Quiz
                  </Button>
                  <Button onClick={onOpenBuilder} className="rounded-2xl border border-amber-400/35 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18">
                    Open Quiz Builder
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quizDefinitions.map(definition => (
              <button
                key={definition.key}
                type="button"
                onClick={() => handleSelectQuiz(definition)}
                className={`rounded-2xl border p-4 text-left transition ${selectedQuizKey === definition.key ? 'border-fuchsia-500/45 bg-fuchsia-500/12' : 'border-white/10 bg-black/25 hover:bg-white/5'}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={definition.kind === 'mandatory' ? 'border-amber-500/35 bg-amber-500/12 text-amber-100' : 'border-cyan-500/35 bg-cyan-500/12 text-cyan-100'}>
                    {definition.badge}
                  </Badge>
                  {definition.rankLabel && <Badge className={`${rankBadgeClass?.(definition.rankKey) || 'border-white/10 bg-white/10 text-zinc-200'}`}>{definition.rankLabel}</Badge>}
                  {definition.progressLabel && <Badge className="border-emerald-500/35 bg-emerald-500/12 text-emerald-100">{definition.progressLabel}</Badge>}
                </div>
                <div className="mt-3 text-sm font-semibold text-white">{definition.title}</div>
                <div className="mt-1 text-xs text-zinc-400">{definition.description}</div>
                <div className="mt-3 flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  <span>{definition.questions.length} questions</span>
                  {definition.sortLabel && <span>{definition.sortLabel}</span>}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedQuiz && (
        <ExperimentalStaffQuiz
          defaultName={defaultName}
          title={selectedQuiz.title}
          subtitle={selectedQuiz.description}
          questions={selectedQuiz.questions}
          recommendedPass={selectedQuiz.passScore || 80}
          accent={selectedQuiz.kind === 'mandatory' ? 'amber' : 'fuchsia'}
          onComplete={onQuizComplete}
        />
      )}

      {selectedQuiz && canManageCheckboxes && questionBankOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-white">{selectedQuiz.title} Question Bank</div>
                <div className="mt-1 text-sm text-zinc-400">{selectedQuiz.description}</div>
              </div>
              <button type="button" onClick={() => setQuestionBankOpen(false)} className="text-sm text-zinc-400 hover:text-white">Close</button>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedStaff && typeof onToggleAssignment === 'function' && (
                <Button
                  onClick={() => onToggleAssignment(selectedQuiz)}
                  className={`rounded-2xl border ${isAssignedToSelected ? 'border-emerald-400/35 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/18' : 'border-cyan-400/35 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18'}`}
                >
                  {isAssignedToSelected ? `Unassign from ${selectedStaff.name}` : `Assign to ${selectedStaff.name}`}
                </Button>
              )}
              <Button onClick={() => onAddManagedQuestion?.(selectedQuiz.sourceType === 'managed' ? selectedQuiz.key : null)} className="rounded-2xl border border-amber-400/35 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18">
                {selectedQuiz.sourceType === 'managed' ? 'Add Question' : 'Create Managed Quiz'}
              </Button>
              <Button onClick={onOpenBuilder} className="rounded-2xl border border-white/15 bg-black/25 text-zinc-100 hover:bg-white/10">
                Open Quiz Builder
              </Button>
            </div>
            <div className="space-y-3">
              {selectedQuiz.sourceItems?.map((item, index) => (
                <div key={item.id || `${selectedQuiz.key}-${index}`} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-white/10 bg-white/10 text-zinc-200">Question {index + 1}</Badge>
                        <Badge className="border-cyan-500/35 bg-cyan-500/12 text-cyan-100">{item.category || 'General'}</Badge>
                      </div>
                      <div className="mt-3 text-sm font-semibold text-white">{item.question}</div>
                      <div className="mt-3 space-y-2 text-sm text-zinc-300">
                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2 text-emerald-100">Correct: {item.correctAnswer}</div>
                        {(item.wrongAnswers || []).map((answer, wrongIndex) => (
                          <div key={`${item.id || index}-wrong-${wrongIndex}`} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-zinc-300">
                            Wrong option: {answer}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={() => onEditQuizQuestion?.(selectedQuiz, item)} className="rounded-2xl border border-fuchsia-400/35 bg-fuchsia-500/12 text-fuchsia-100 hover:bg-fuchsia-500/18">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
              {!selectedQuiz.sourceItems?.length && (
                <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
                  No questions are available for this quiz yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
