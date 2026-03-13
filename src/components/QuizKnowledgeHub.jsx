import React from 'react';
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
  defaultName,
  rankBadgeClass,
}) {
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
                <Badge className="border-white/10 bg-white/10 text-zinc-200">Checkboxes now surface as quizzes</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                Entry Quiz, Core Values Quiz, and Staff Menu Quiz now show as proper quiz packs by rank. The mandatory rules quiz sits in the same dashboard and uses the same confirmation flow.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Builder</div>
              <div className="mt-2 text-sm text-zinc-300">Use the builder to manage quiz lines, answers, and rank visibility.</div>
              {canManageCheckboxes && (
                <Button onClick={onOpenBuilder} className="mt-4 rounded-2xl border border-amber-400/35 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18">
                  Open Quiz Builder
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quizDefinitions.map(definition => (
              <button
                key={definition.key}
                type="button"
                onClick={() => setSelectedQuizKey(definition.key)}
                className={`rounded-2xl border p-4 text-left transition ${selectedQuizKey === definition.key ? 'border-fuchsia-500/45 bg-fuchsia-500/12' : 'border-white/10 bg-black/25 hover:bg-white/5'}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={definition.kind === 'mandatory' ? 'border-amber-500/35 bg-amber-500/12 text-amber-100' : 'border-cyan-500/35 bg-cyan-500/12 text-cyan-100'}>
                    {definition.badge}
                  </Badge>
                  {definition.rankLabel && <Badge className={`${rankBadgeClass?.(definition.rankKey) || 'border-white/10 bg-white/10 text-zinc-200'}`}>{definition.rankLabel}</Badge>}
                </div>
                <div className="mt-3 text-sm font-semibold text-white">{definition.title}</div>
                <div className="mt-1 text-xs text-zinc-400">{definition.description}</div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-zinc-500">{definition.questions.length} questions</div>
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
        />
      )}
    </div>
  );
}
