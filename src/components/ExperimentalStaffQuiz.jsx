import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { EXPERIMENTAL_QUIZ_QUESTIONS } from '@/experimentalQuizData';

const LETTERS = ['A', 'B', 'C', 'D'];

function shuffleQuestions(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function gradeSummary(percent) {
  if (percent >= 95) return { label: 'Outstanding', className: 'border-amber-400/40 bg-amber-500/12 text-amber-100' };
  if (percent >= 80) return { label: 'Pass', className: 'border-emerald-400/40 bg-emerald-500/12 text-emerald-100' };
  if (percent >= 60) return { label: 'Borderline', className: 'border-yellow-400/40 bg-yellow-500/12 text-yellow-100' };
  return { label: 'Needs Review', className: 'border-red-400/40 bg-red-500/12 text-red-100' };
}

export default function ExperimentalStaffQuiz({
  defaultName = '',
  title = 'Mandatory Quiz - General Rules',
  subtitle = 'General rules knowledge check with immediate answer feedback.',
  questions: providedQuestions = EXPERIMENTAL_QUIZ_QUESTIONS,
  recommendedPass = 80,
  accent = 'fuchsia',
}) {
  const [playerName, setPlayerName] = useState(defaultName);
  const [attemptSeed, setAttemptSeed] = useState(0);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [answers, setAnswers] = useState([]);

  const questions = useMemo(() => shuffleQuestions(providedQuestions || []), [providedQuestions, attemptSeed]);
  const currentQuestion = questions[currentIndex] || null;
  const isFinished = started && currentIndex >= questions.length;
  const totalQuestions = questions.length;
  const correctAnswers = answers.filter(item => item.correct).length;
  const scorePercent = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const missedQuestions = answers.filter(item => !item.correct);
  const grade = gradeSummary(scorePercent);
  const accentButton = accent === 'amber'
    ? 'border-amber-400/40 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
    : 'border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500';
  const accentSoft = accent === 'amber'
    ? 'border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-white/0 to-orange-500/10'
    : 'border-fuchsia-500/25 bg-gradient-to-br from-fuchsia-500/10 via-white/0 to-cyan-500/10';

  function beginQuiz() {
    setAttemptSeed(prev => prev + 1);
    setAnswers([]);
    setSelectedIndex(null);
    setCurrentIndex(0);
    setStarted(true);
  }

  function submitAnswer(answerIndex) {
    if (!currentQuestion || selectedIndex !== null) return;
    setSelectedIndex(answerIndex);
  }

  function nextStep() {
    if (!currentQuestion || selectedIndex === null) return;
    const correct = selectedIndex === currentQuestion.answer;
    setAnswers(prev => [
      ...prev,
      {
        category: currentQuestion.category,
        question: currentQuestion.question,
        correct,
        selectedIndex,
        correctIndex: currentQuestion.answer,
        correctAnswer: currentQuestion.options[currentQuestion.answer],
      },
    ]);
    setSelectedIndex(null);
    setCurrentIndex(prev => prev + 1);
  }

  function resetQuiz() {
    setStarted(false);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswers([]);
  }

  return (
    <div className="space-y-4">
      {!started && (
        <div className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`rounded-2xl border p-4 text-sm text-zinc-200 ${accentSoft}`}>
                {subtitle}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Question pool</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{totalQuestions}</div>
                  <div className="mt-1 text-xs text-zinc-400">Randomized every attempt</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Recommended pass</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{recommendedPass}%</div>
                  <div className="mt-1 text-xs text-zinc-400">Configured for this quiz pack</div>
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Display name</div>
                <Input
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  placeholder="Enter staff name for this attempt"
                  className="border-white/10 bg-black/30 text-white"
                />
              </div>
              <Button type="button" onClick={beginQuiz} className={`w-full rounded-2xl text-white ${accentButton}`}>
                Start Quiz
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-300">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-cyan-500/35 bg-cyan-500/12 text-cyan-200">Quiz Runner</Badge>
                  <Badge className="border-white/10 bg-white/10 text-zinc-200">Same affirmation logic everywhere</Badge>
                </div>
                <p className="mt-3 leading-6 text-zinc-300">
                  This uses the same confirmation and results flow for mandatory quizzes and knowledge packs so the dashboard feels consistent.
                </p>
              </div>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">What this version does</div>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li>Randomizes the question order every attempt.</li>
                  <li>Shows immediate answer feedback.</li>
                  <li>Keeps a missed-question breakdown at the end.</li>
                  <li>Reuses the same polished structure across quiz types.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {started && !isFinished && currentQuestion && (
        <div className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Attempt Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-fuchsia-500/35 bg-fuchsia-500/12 text-fuchsia-200">{title}</Badge>
                <Badge className="border-white/10 bg-white/10 text-zinc-200">{playerName || 'Staff Member'}</Badge>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500">
                  <span>Progress</span>
                  <span>{Math.min(currentIndex + 1, totalQuestions)} / {totalQuestions}</span>
                </div>
                <Progress value={((currentIndex) / totalQuestions) * 100} className="mt-3 h-2.5 bg-white/10" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Current category</div>
                  <div className="mt-2 text-base font-semibold text-white">{currentQuestion.category}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Current score</div>
                  <div className="mt-2 text-base font-semibold text-white">{correctAnswers} correct</div>
                </div>
              </div>
              <Button type="button" variant="secondary" onClick={resetQuiz} className="w-full rounded-2xl border border-white/15 bg-black/30 text-zinc-100 hover:bg-white/10">
                Exit Attempt
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Question {currentIndex + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge className="border-cyan-500/35 bg-cyan-500/12 text-cyan-200">{currentQuestion.category}</Badge>
              <div className="text-2xl font-semibold leading-tight text-white">{currentQuestion.question}</div>
              <div className="space-y-3">
                {currentQuestion.options.map((option, optionIndex) => {
                  const isCorrect = optionIndex === currentQuestion.answer;
                  const isSelected = optionIndex === selectedIndex;
                  const resolvedState = selectedIndex === null
                    ? 'idle'
                    : isCorrect
                      ? 'correct'
                      : isSelected
                        ? 'wrong'
                        : 'dimmed';
                  const stateClass = resolvedState === 'correct'
                    ? 'border-emerald-400/45 bg-emerald-500/10 text-white'
                    : resolvedState === 'wrong'
                      ? 'border-red-400/45 bg-red-500/10 text-white'
                      : resolvedState === 'dimmed'
                        ? 'border-white/10 bg-black/15 text-zinc-500 opacity-60'
                        : 'border-white/10 bg-black/25 text-zinc-200 hover:border-fuchsia-400/35 hover:bg-fuchsia-500/8';
                  return (
                    <button key={`${currentQuestion.question}-${optionIndex}`} type="button" disabled={selectedIndex !== null} onClick={() => submitAnswer(optionIndex)} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${stateClass}`}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-sm font-semibold text-white">
                        {LETTERS[optionIndex]}
                      </div>
                      <div className="pt-0.5 text-sm leading-6">{option}</div>
                    </button>
                  );
                })}
              </div>
              {selectedIndex !== null && (
                <div className={`rounded-2xl border p-4 text-sm ${selectedIndex === currentQuestion.answer ? 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100' : 'border-red-400/35 bg-red-500/10 text-red-100'}`}>
                  {selectedIndex === currentQuestion.answer
                    ? 'Correct. Move to the next question.'
                    : `Incorrect. Correct answer: ${LETTERS[currentQuestion.answer]}. ${currentQuestion.options[currentQuestion.answer]}`}
                </div>
              )}
              <Button type="button" onClick={nextStep} disabled={selectedIndex === null} className={`w-full rounded-2xl text-white disabled:opacity-50 ${accentButton}`}>
                {currentIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next Question'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {isFinished && (
        <div className="grid gap-4 xl:grid-cols-[0.86fr,1.14fr]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`${grade.className} border`}>{grade.label}</Badge>
                <Badge className="border-white/10 bg-white/10 text-zinc-200">{playerName || 'Staff Member'}</Badge>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Final score</div>
                <div className="mt-2 text-4xl font-semibold text-white">{correctAnswers}/{totalQuestions}</div>
                <div className="mt-1 text-sm text-zinc-400">{scorePercent}% correct</div>
                <Progress value={scorePercent} className="mt-4 h-3 bg-white/10" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Correct answers</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{correctAnswers}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Missed answers</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{missedQuestions.length}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={beginQuiz} className={`rounded-2xl text-white ${accentButton}`}>
                  Retake Quiz
                </Button>
                <Button type="button" variant="secondary" onClick={resetQuiz} className="rounded-2xl border border-white/15 bg-black/30 text-zinc-100 hover:bg-white/10">
                  New Attempt Setup
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Missed Questions Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!missedQuestions.length && (
                <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  Clean run. No missed questions in this attempt.
                </div>
              )}
              {missedQuestions.map((item, index) => (
                <div key={`${item.question}-${index}`} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-red-400/35 bg-red-500/10 text-red-100">Missed</Badge>
                    <Badge className="border-white/10 bg-white/10 text-zinc-200">{item.category}</Badge>
                  </div>
                  <div className="mt-3 text-sm font-semibold leading-6 text-white">{item.question}</div>
                  <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-500/8 p-3 text-sm text-emerald-100">
                    Correct answer: {LETTERS[item.correctIndex]}. {item.correctAnswer}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
