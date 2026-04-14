import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ExperimentalStaffQuiz from '@/components/ExperimentalStaffQuiz';
import VideoQuizRunner from '@/components/VideoQuizRunner';

export default function QuizKnowledgeHub({
  quizDefinitions,
  selectedQuizKey,
  setSelectedQuizKey,
  selectedQuiz,
  canManageCheckboxes,
  onOpenBuilder,
  onEditQuizQuestion,
  onAddManagedQuestion,
  onAddVideoQuiz,
  onEditVideoQuiz,
  onDeleteVideoQuiz,
  defaultName,
  rankBadgeClass,
  selectedStaff = null,
  isAssignedToSelected = false,
  onToggleAssignment = null,
  onQuizComplete = null,
}) {
  const [questionBankOpen, setQuestionBankOpen] = useState(false);
  const [browseTab, setBrowseTab] = useState('standard');

  const modalActionClass = 'rounded-2xl border px-4 py-2 text-sm font-medium shadow-[0_12px_32px_rgba(0,0,0,0.24)]';
  const cardBadgeClass = 'rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase';

  const standardQuizzes = useMemo(
    () => quizDefinitions.filter(definition => definition.kind !== 'video' && definition.browseCategory !== 'instruction'),
    [quizDefinitions]
  );
  const instructionQuizzes = useMemo(
    () => quizDefinitions.filter(definition => definition.browseCategory === 'instruction'),
    [quizDefinitions]
  );
  const videoQuizzes = useMemo(() => quizDefinitions.filter(definition => definition.kind === 'video'), [quizDefinitions]);

  useEffect(() => {
    if (!canManageCheckboxes) setQuestionBankOpen(false);
  }, [canManageCheckboxes]);

  useEffect(() => {
    if (selectedQuiz?.kind === 'video') setBrowseTab('video');
    else if (selectedQuiz?.browseCategory === 'instruction') setBrowseTab('instruction');
  }, [selectedQuiz?.kind, selectedQuiz?.browseCategory]);

  function handleSelectQuiz(definition) {
    setSelectedQuizKey(definition.key);
    setBrowseTab(definition.kind === 'video' ? 'video' : definition.browseCategory === 'instruction' ? 'instruction' : 'standard');
    if (canManageCheckboxes) setQuestionBankOpen(true);
  }

  function getVideoSummary(definition) {
    const scenes = Array.isArray(definition.scenes) ? definition.scenes : [];
    const promptCount = scenes.reduce((total, scene) => total + (Array.isArray(scene.notePrompts) ? scene.notePrompts.length : 0), 0);
    return `${scenes.length} clips / ${promptCount} prompts`;
  }

  function renderQuizCard(definition) {
    const badgeTone = definition.kind === 'video'
      ? 'border-red-400/45 bg-red-500/18 text-red-50'
      : definition.browseCategory === 'instruction'
        ? 'border-amber-400/45 bg-amber-500/18 text-amber-50'
        : definition.kind === 'mandatory'
          ? 'border-amber-400/45 bg-amber-500/18 text-amber-50'
          : 'border-cyan-400/45 bg-cyan-500/18 text-cyan-50';
    return (
      <button
        key={definition.key}
        type="button"
        onClick={() => handleSelectQuiz(definition)}
        className={`rounded-2xl border p-4 text-left transition ${selectedQuizKey === definition.key ? 'border-fuchsia-500/45 bg-fuchsia-500/12' : 'border-white/10 bg-black/25 hover:bg-white/5'}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`${cardBadgeClass} ${badgeTone}`}>
            {definition.badge}
          </Badge>
          {definition.rankLabel && <Badge className={`${cardBadgeClass} ${rankBadgeClass?.(definition.rankKey) || 'border-white/10 bg-white/10 text-zinc-200'}`}>{definition.rankLabel}</Badge>}
          {definition.progressLabel && <Badge className={`${cardBadgeClass} border-emerald-400/45 bg-emerald-500/18 text-emerald-50`}>{definition.progressLabel}</Badge>}
        </div>
        <div className="mt-3 text-sm font-semibold text-white">{definition.title}</div>
        <div className="mt-1 text-xs text-zinc-400">{definition.description}</div>
        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          <span>{definition.kind === 'video' ? getVideoSummary(definition) : `${definition.questions.length} questions`}</span>
          {definition.sortLabel && <span>{definition.sortLabel}</span>}
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Quizzes & Knowledge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/25 p-3">
            <Badge className="border-fuchsia-500/35 bg-fuchsia-500/12 text-fuchsia-200">Knowledge Packs</Badge>
            <Badge className="border-white/10 bg-white/10 text-zinc-200">Standard quizzes, instruction flows, and scenario-based video reviews</Badge>
            {canManageCheckboxes && (
              <div className="ml-auto flex flex-wrap gap-2">
                <Button onClick={() => onAddManagedQuestion?.(null)} className="rounded-2xl border border-emerald-400/35 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/18">
                  Create New Quiz
                </Button>
                <Button onClick={() => { setBrowseTab('video'); onAddVideoQuiz?.(); }} className="rounded-2xl border border-red-400/35 bg-red-500/12 text-red-100 hover:bg-red-500/18">
                  Create Video Quiz
                </Button>
                <Button onClick={onOpenBuilder} className="rounded-2xl border border-amber-400/35 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18">
                  Open Quiz Builder
                </Button>
              </div>
            )}
          </div>

          <Tabs value={browseTab} onValueChange={setBrowseTab} className="space-y-4">
            <TabsList className="grid w-full max-w-[620px] grid-cols-3 rounded-2xl border border-white/10 bg-black/25 p-1">
              <TabsTrigger value="standard" className="rounded-xl data-[state=active]:bg-white/12 data-[state=active]:text-white">Standard Quizzes</TabsTrigger>
              <TabsTrigger value="instruction" className="rounded-xl data-[state=active]:bg-amber-500/18 data-[state=active]:text-amber-50">Instruction Quizzes</TabsTrigger>
              <TabsTrigger value="video" className="rounded-xl data-[state=active]:bg-red-500/18 data-[state=active]:text-red-50">Video Quizzes</TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="mt-0">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {standardQuizzes.map(renderQuizCard)}
              </div>
            </TabsContent>

            <TabsContent value="instruction" className="mt-0 space-y-3">
              {!!instructionQuizzes.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {instructionQuizzes.map(renderQuizCard)}
                </div>
              ) : (
                <div className="rounded-3xl border border-amber-500/20 bg-[linear-gradient(135deg,rgba(10,10,15,0.96),rgba(146,64,14,0.12),rgba(120,53,15,0.14))] p-5">
                  <div className="text-sm font-semibold text-white">No instruction quizzes yet</div>
                  <div className="mt-2 text-sm text-zinc-400">Instruction quizzes combine a mandatory visual introduction with a scored quiz at the end.</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="video" className="mt-0 space-y-3">
              {!!videoQuizzes.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {videoQuizzes.map(renderQuizCard)}
                </div>
              ) : (
                <div className="rounded-3xl border border-red-500/20 bg-[linear-gradient(135deg,rgba(10,10,15,0.96),rgba(127,29,29,0.12),rgba(136,19,55,0.14))] p-5">
                  <div className="text-sm font-semibold text-white">No video quizzes yet</div>
                  <div className="mt-2 text-sm text-zinc-400">Create a scenario-based review where staff watch one or more clips and submit written observations for each scene.</div>
                  {canManageCheckboxes && (
                    <div className="mt-4">
                      <Button onClick={() => onAddVideoQuiz?.()} className="rounded-2xl border border-red-400/35 bg-red-500/12 text-red-100 hover:bg-red-500/18">
                        Create First Video Quiz
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedQuiz && selectedQuiz.kind !== 'video' && (
        <ExperimentalStaffQuiz
          key={selectedQuiz.key}
          defaultName={defaultName}
          title={selectedQuiz.title}
          subtitle={selectedQuiz.description}
          questions={selectedQuiz.questions}
          recommendedPass={selectedQuiz.passScore || 80}
          accent={selectedQuiz.kind === 'mandatory' ? 'amber' : 'fuchsia'}
          introSlides={selectedQuiz.introSlides || []}
          onComplete={(result) => onQuizComplete?.(selectedQuiz, result)}
        />
      )}

      {selectedQuiz && selectedQuiz.kind === 'video' && (
        <VideoQuizRunner
          key={selectedQuiz.key}
          defaultName={defaultName}
          title={selectedQuiz.title}
          subtitle={selectedQuiz.description}
          scenes={selectedQuiz.scenes || []}
          onComplete={(result) => onQuizComplete?.(selectedQuiz, result)}
        />
      )}

      {selectedQuiz && canManageCheckboxes && questionBankOpen && selectedQuiz.kind !== 'video' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-white/15 bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(10,10,15,0.98))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.5)]">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-lg font-semibold text-white">{selectedQuiz.title} Question Bank</div>
                <div className="mt-1 text-sm text-zinc-400">{selectedQuiz.description}</div>
              </div>
              <button type="button" onClick={() => setQuestionBankOpen(false)} className="rounded-2xl border border-white/10 bg-black/25 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white">Close</button>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedStaff && typeof onToggleAssignment === 'function' && (
                <Button onClick={() => onToggleAssignment(selectedQuiz)} className={`${modalActionClass} ${isAssignedToSelected ? 'border-emerald-400/45 bg-emerald-500/18 text-emerald-50 hover:bg-emerald-500/24' : 'border-cyan-400/45 bg-cyan-500/18 text-cyan-50 hover:bg-cyan-500/24'}`}>
                  {isAssignedToSelected ? `Unassign from ${selectedStaff.name}` : `Assign to ${selectedStaff.name}`}
                </Button>
              )}
              {selectedQuiz.browseCategory !== 'instruction' && (
                <Button onClick={() => onAddManagedQuestion?.(selectedQuiz.sourceType === 'managed' ? selectedQuiz.key : null)} className={`${modalActionClass} border-amber-400/45 bg-amber-500/18 text-amber-50 hover:bg-amber-500/24`}>
                  {selectedQuiz.sourceType === 'managed' ? 'Add Question' : 'Create Managed Quiz'}
                </Button>
              )}
              <Button onClick={onOpenBuilder} className={`${modalActionClass} border-white/15 bg-white/8 text-zinc-100 hover:bg-white/12`}>
                Open Quiz Builder
              </Button>
            </div>
            <div className="space-y-3">
              {selectedQuiz.sourceItems?.map((item, index) => (
                <div key={item.id || `${selectedQuiz.key}-${index}`} className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${cardBadgeClass} border-white/10 bg-white/12 text-zinc-100`}>Question {index + 1}</Badge>
                        <Badge className={`${cardBadgeClass} border-cyan-400/45 bg-cyan-500/18 text-cyan-50`}>{item.category || 'General'}</Badge>
                      </div>
                      <div className="mt-3 text-base font-semibold leading-6 text-white">{item.question}</div>
                      <div className="mt-3 space-y-2 text-sm text-zinc-300">
                        <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/14 px-3 py-2.5 text-emerald-50">Correct: {item.correctAnswer}</div>
                        {(item.wrongAnswers || []).map((answer, wrongIndex) => (
                          <div key={`${item.id || index}-wrong-${wrongIndex}`} className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-zinc-200">
                            Wrong option: {answer}
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedQuiz.browseCategory !== 'instruction' && (
                      <Button onClick={() => onEditQuizQuestion?.(selectedQuiz, item)} className={`${modalActionClass} border-fuchsia-400/45 bg-fuchsia-500/18 text-fuchsia-50 hover:bg-fuchsia-500/24`}>
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {!selectedQuiz.sourceItems?.length && <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">No questions are available for this quiz yet.</div>}
            </div>
          </div>
        </div>
      )}

      {selectedQuiz && canManageCheckboxes && questionBankOpen && selectedQuiz.kind === 'video' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-white/15 bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(10,10,15,0.98))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.5)]">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-lg font-semibold text-white">{selectedQuiz.title} Video Setup</div>
                <div className="mt-1 text-sm text-zinc-400">{selectedQuiz.description}</div>
              </div>
              <button type="button" onClick={() => setQuestionBankOpen(false)} className="rounded-2xl border border-white/10 bg-black/25 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white">Close</button>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedStaff && typeof onToggleAssignment === 'function' && (
                <Button onClick={() => onToggleAssignment(selectedQuiz)} className={`${modalActionClass} ${isAssignedToSelected ? 'border-emerald-400/45 bg-emerald-500/18 text-emerald-50 hover:bg-emerald-500/24' : 'border-cyan-400/45 bg-cyan-500/18 text-cyan-50 hover:bg-cyan-500/24'}`}>
                  {isAssignedToSelected ? `Unassign from ${selectedStaff.name}` : `Assign to ${selectedStaff.name}`}
                </Button>
              )}
              <Button onClick={() => onEditVideoQuiz?.(selectedQuiz)} className={`${modalActionClass} border-red-400/45 bg-red-500/18 text-red-50 hover:bg-red-500/24`}>
                Edit Video Quiz
              </Button>
              <Button onClick={() => onDeleteVideoQuiz?.(selectedQuiz)} className={`${modalActionClass} border-white/15 bg-black/30 text-zinc-100 hover:bg-white/10`}>
                Delete Video Quiz
              </Button>
            </div>
            <div className="space-y-4">
              {(selectedQuiz.scenes || []).map((scene, index) => (
                <div key={scene.id || `${selectedQuiz.key}-scene-${index}`} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <Badge className={`${cardBadgeClass} border-red-400/45 bg-red-500/18 text-red-50`}>Clip {index + 1}</Badge>
                    <div className="text-base font-semibold text-white">{scene.title || `Scene ${index + 1}`}</div>
                  </div>
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200 break-all">{scene.videoUrl || 'No video URL configured.'}</div>
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Things To Watch For</div>
                      <div className="mt-2 space-y-2">
                        {(scene.watchPoints || []).map((point, pointIndex) => (
                          <div key={`${scene.id}-watch-${pointIndex}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">{point}</div>
                        ))}
                        {!scene.watchPoints?.length && <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-400">No watch points configured.</div>}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Answer Prompts</div>
                      <div className="mt-2 space-y-2">
                        {(scene.notePrompts || []).map((prompt, promptIndex) => (
                          <div key={`${scene.id}-prompt-${promptIndex}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">{prompt}</div>
                        ))}
                        {!scene.notePrompts?.length && <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-400">No prompts configured.</div>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!(selectedQuiz.scenes || []).length && <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">No video scenes are available for this quiz yet.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
