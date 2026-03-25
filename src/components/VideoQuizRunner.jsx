import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

export default function VideoQuizRunner({
  defaultName = '',
  title,
  subtitle,
  videoUrl,
  watchPoints = [],
  notePrompts = [],
  onComplete = null,
}) {
  const [playerName, setPlayerName] = useState(defaultName);
  const [notes, setNotes] = useState(() => notePrompts.map(() => ''));
  const [submitted, setSubmitted] = useState(false);

  const normalizedPrompts = useMemo(() => (
    Array.isArray(notePrompts) && notePrompts.length
      ? notePrompts
      : ['List the rule breaks or concerns you spotted in the clip.']
  ), [notePrompts]);

  const completionPercent = normalizedPrompts.length
    ? Math.round((notes.filter(value => String(value || '').trim()).length / normalizedPrompts.length) * 100)
    : 0;

  function updateNote(index, value) {
    setNotes(prev => {
      const next = [...prev];
      while (next.length < normalizedPrompts.length) next.push('');
      next[index] = value;
      return next;
    });
  }

  function submitVideoQuiz() {
    const trimmedNotes = notes.map(value => String(value || '').trim());
    const answers = normalizedPrompts.map((prompt, index) => ({
      category: 'Video Response',
      question: prompt,
      selectedAnswer: trimmedNotes[index] || 'No notes submitted.',
      correctAnswer: '',
      correct: Boolean(trimmedNotes[index]),
    }));
    onComplete?.({
      playerName: playerName || 'Staff Member',
      scorePercent: 100,
      passed: true,
      answers,
      mode: 'video',
    });
    setSubmitted(true);
  }

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-fuchsia-500/20 bg-[linear-gradient(135deg,rgba(5,10,20,0.96),rgba(8,145,178,0.08),rgba(88,28,135,0.12))] p-4 text-sm text-zinc-200">
            {subtitle || 'Watch the training video carefully, note the rule breaks, and submit your observations for review.'}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Format</div>
              <div className="mt-2 text-base font-semibold text-white">Video review</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Prompts</div>
              <div className="mt-2 text-base font-semibold text-white">{normalizedPrompts.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Completion</div>
              <div className="mt-2 text-base font-semibold text-white">{completionPercent}%</div>
              <Progress value={completionPercent} className="mt-3 h-2 bg-white/10" />
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Display name</div>
            <Input
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Enter staff name for this submission"
              className="border-white/10 bg-black/30 text-white"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr,0.92fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Training Clip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {videoUrl ? (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                <iframe
                  src={videoUrl}
                  title={title}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
                No video URL configured yet.
              </div>
            )}
            {videoUrl && (
              <a href={videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100">
                Open video in a new tab
              </a>
            )}
            {!!watchPoints.length && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Things to watch for</div>
                <div className="mt-3 space-y-2">
                  {watchPoints.map((point, index) => (
                    <div key={['watch', index].join('-')} className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">
                      <Badge className="border-amber-400/35 bg-amber-500/12 text-amber-100">{index + 1}</Badge>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Submission Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {normalizedPrompts.map((prompt, index) => (
              <div key={['prompt', index].join('-')}>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                  <Badge className="border-fuchsia-400/35 bg-fuchsia-500/12 text-fuchsia-100">Prompt {index + 1}</Badge>
                  <span>{prompt}</span>
                </div>
                <Textarea
                  value={notes[index] || ''}
                  onChange={(event) => updateNote(index, event.target.value)}
                  className="min-h-[120px] border-white/10 bg-black/30 text-white"
                  placeholder="Write what happened, what rule breaks you identified, and what staff should watch out for."
                />
              </div>
            ))}
            {submitted && (
              <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                Video quiz submitted. Head of Staff can now review your notes.
              </div>
            )}
            <Button type="button" onClick={submitVideoQuiz} className="w-full rounded-2xl text-white">
              Submit Video Quiz Notes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
