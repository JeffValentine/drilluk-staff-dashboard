import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

function normalizeScenes(scenes = [], title = 'Video Quiz') {
  if (!Array.isArray(scenes) || !scenes.length) {
    return [
      {
        id: 'scene-1',
        title,
        videoUrl: '',
        watchPoints: [],
        notePrompts: ['List the rule breaks or concerns you spotted in the clip.'],
      },
    ];
  }
  return scenes.map((scene, index) => ({
    id: scene.id || `scene-${index + 1}`,
    title: String(scene.title || `Scene ${index + 1}`).trim(),
    videoUrl: String(scene.videoUrl || '').trim(),
    watchPoints: Array.isArray(scene.watchPoints) ? scene.watchPoints.map(value => String(value || '').trim()).filter(Boolean) : [],
    notePrompts: Array.isArray(scene.notePrompts) && scene.notePrompts.length
      ? scene.notePrompts.map(value => String(value || '').trim()).filter(Boolean)
      : ['List the rule breaks or concerns you spotted in the clip.'],
  }));
}

function toEmbeddableVideoUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!value) return '';

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (host === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : value;
    }

    if (host.includes('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) return value;
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : value;
      }
      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : value;
      }
      if (url.pathname.startsWith('/live/')) {
        const id = url.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : value;
      }
    }

    if (host.includes('vimeo.com')) {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://player.vimeo.com/video/${id}` : value;
    }
  } catch {
    return value;
  }

  return value;
}

export default function VideoQuizRunner({
  defaultName = '',
  title,
  subtitle,
  scenes = [],
  onComplete = null,
}) {
  const normalizedScenes = useMemo(() => normalizeScenes(scenes, title), [scenes, title]);
  const [playerName, setPlayerName] = useState(defaultName);
  const [notesByScene, setNotesByScene] = useState(() => normalizedScenes.map(scene => scene.notePrompts.map(() => '')));
  const [submitted, setSubmitted] = useState(false);

  const totalPrompts = normalizedScenes.reduce((total, scene) => total + scene.notePrompts.length, 0);
  const completedPrompts = notesByScene.flat().filter(value => String(value || '').trim()).length;
  const completionPercent = totalPrompts ? Math.round((completedPrompts / totalPrompts) * 100) : 0;

  function updateNote(sceneIndex, promptIndex, value) {
    setNotesByScene(prev => prev.map((sceneNotes, index) => {
      if (index !== sceneIndex) return sceneNotes;
      const next = [...sceneNotes];
      while (next.length < normalizedScenes[sceneIndex].notePrompts.length) next.push('');
      next[promptIndex] = value;
      return next;
    }));
  }

  function submitVideoQuiz() {
    const answers = normalizedScenes.flatMap((scene, sceneIndex) =>
      scene.notePrompts.map((prompt, promptIndex) => ({
        category: scene.title || `Scene ${sceneIndex + 1}`,
        question: prompt,
        selectedAnswer: String(notesByScene?.[sceneIndex]?.[promptIndex] || '').trim() || 'No notes submitted.',
        correctAnswer: '',
        correct: Boolean(String(notesByScene?.[sceneIndex]?.[promptIndex] || '').trim()),
      }))
    );
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
            {subtitle || 'Watch each training clip carefully, note the rule breaks, and submit your observations for review.'}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Format</div>
              <div className="mt-2 text-base font-semibold text-white">Video review</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Clips and prompts</div>
              <div className="mt-2 text-base font-semibold text-white">{normalizedScenes.length} clips / {totalPrompts} prompts</div>
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

      <div className="space-y-4">
        {normalizedScenes.map((scene, sceneIndex) => {
          const embeddedVideoUrl = toEmbeddableVideoUrl(scene.videoUrl);
          return (
            <div key={scene.id} className="grid gap-4 xl:grid-cols-[1fr,0.92fr]">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>{scene.title || `Scene ${sceneIndex + 1}`}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {embeddedVideoUrl ? (
                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                      <iframe
                        src={embeddedVideoUrl}
                        title={scene.title || title}
                        className="aspect-video w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
                      No video URL configured yet.
                    </div>
                  )}
                  {scene.videoUrl && (
                    <a href={scene.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100">
                      Open video in a new tab
                    </a>
                  )}
                  {!!scene.watchPoints.length && (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Things to watch for</div>
                      <div className="mt-3 space-y-2">
                        {scene.watchPoints.map((point, index) => (
                          <div key={`${scene.id}-watch-${index}`} className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">
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
                  <CardTitle>Scene Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scene.notePrompts.map((prompt, promptIndex) => (
                    <div key={`${scene.id}-prompt-${promptIndex}`}>
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                        <Badge className="border-fuchsia-400/35 bg-fuchsia-500/12 text-fuchsia-100">Prompt {promptIndex + 1}</Badge>
                        <span>{prompt}</span>
                      </div>
                      <Textarea
                        value={notesByScene?.[sceneIndex]?.[promptIndex] || ''}
                        onChange={(event) => updateNote(sceneIndex, promptIndex, event.target.value)}
                        className="min-h-[120px] border-white/10 bg-black/30 text-white"
                        placeholder="Write what happened, what rule breaks you identified, and what staff should watch out for."
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          );
        })}

        {submitted && (
          <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            Video quiz submitted. Head of Staff can now review your notes.
          </div>
        )}

        <Button type="button" onClick={submitVideoQuiz} className="w-full rounded-2xl text-white">
          Submit Video Quiz Notes
        </Button>
      </div>
    </div>
  );
}
