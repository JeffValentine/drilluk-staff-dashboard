import React, { useMemo, useState } from 'react';
import { ArrowLeft, ClipboardCheck, FileText, ShieldCheck, UserRoundPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ExperimentalStaffQuiz from '@/components/ExperimentalStaffQuiz';
import {
  INTERVIEW_CORE_VALUES_QUIZ,
  INTERVIEW_ENTRY_QUIZ,
  INTERVIEW_FORM_FIELDS,
  INTERVIEW_LONG_FIELDS,
} from '@/interviewQuestionBank';

const steps = ['form', 'entry', 'core', 'submit'];

function emptyForm() {
  return {
    fullName: '',
    discordName: '',
    age: '',
    country: '',
    hoursPerWeek: '',
    priorBans: '',
    staffExperience: '',
    whyStaff: '',
    whyDrill: '',
  };
}

export default function PublicInterviewFlow({ onBack, onSubmit, loading, error, info }) {
  const [step, setStep] = useState('form');
  const [form, setForm] = useState(emptyForm());
  const [entryResult, setEntryResult] = useState(null);
  const [coreResult, setCoreResult] = useState(null);

  const stepIndex = steps.indexOf(step);
  const readiness = useMemo(() => {
    let done = 1;
    if (entryResult) done += 1;
    if (coreResult) done += 1;
    if (step === 'submit') done += 1;
    return Math.round((done / steps.length) * 100);
  }, [step, entryResult, coreResult]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submitForm(event) {
    event.preventDefault();
    const requiredFilled = [...INTERVIEW_FORM_FIELDS, ...INTERVIEW_LONG_FIELDS].every((field) => String(form[field.key] || '').trim());
    if (!requiredFilled) return;
    setStep('entry');
  }

  async function submitApplication() {
    await onSubmit({ form, entryResult, coreResult });
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10">
        <div className="grid w-full gap-6 xl:grid-cols-[0.88fr,1.12fr]">
          <div className="space-y-5">
            <div className="rounded-[30px] border border-fuchsia-500/20 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.22),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-2 text-sm font-medium text-fuchsia-200">
                <UserRoundPlus className="h-4 w-4" /> Staff Interview
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white">Apply for Drill UK Staff</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300">
                Complete the interview form and the two Trial Moderator knowledge checks. Your answers and quiz results go straight to Head Admin review.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Step 1</div>
                  <div className="mt-2 text-sm font-semibold text-white">Interview form</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Step 2</div>
                  <div className="mt-2 text-sm font-semibold text-white">T-MOD entry quiz</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Step 3</div>
                  <div className="mt-2 text-sm font-semibold text-white">Core values quiz</div>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  <span>Application progress</span>
                  <span>{readiness}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500" style={{ width: `${readiness}%` }} />
                </div>
                <div className="mt-3 text-sm text-zinc-400">Current stage: <span className="text-zinc-200">{step === 'form' ? 'Interview form' : step === 'entry' ? 'T-MOD Entry Quiz' : step === 'core' ? 'T-MOD Core Values Quiz' : 'Submit application'}</span></div>
              </div>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </button>
          </div>

          <div>
            {step === 'form' && (
              <Card className="border-white/10 bg-white/5 shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-cyan-300" /> Interview Form</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitForm} className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      {INTERVIEW_FORM_FIELDS.map((field) => (
                        <div key={field.key}>
                          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">{field.label}</div>
                          <Input
                            type={field.type}
                            value={form[field.key]}
                            onChange={(event) => updateField(field.key, event.target.value)}
                            placeholder={field.placeholder}
                            className="h-11 rounded-2xl border-white/10 bg-black/30 text-white placeholder:text-zinc-500"
                            required={field.required}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-4">
                      {INTERVIEW_LONG_FIELDS.map((field) => (
                        <div key={field.key}>
                          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">{field.label}</div>
                          <Textarea
                            value={form[field.key]}
                            onChange={(event) => updateField(field.key, event.target.value)}
                            placeholder={field.placeholder}
                            className="min-h-[110px] rounded-2xl border-white/10 bg-black/30 text-white placeholder:text-zinc-500"
                            required={field.required}
                          />
                        </div>
                      ))}
                    </div>
                    <Button type="submit" className="h-12 w-full rounded-2xl border border-fuchsia-400/35 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:from-fuchsia-500 hover:to-indigo-500">
                      Continue to T-MOD Entry Quiz
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === 'entry' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">Quiz 1 of 2</Badge>
                  <Badge className="border-white/10 bg-white/10 text-zinc-200">T-MOD Entry Quiz</Badge>
                </div>
                <ExperimentalStaffQuiz
                  defaultName={form.fullName}
                  title={INTERVIEW_ENTRY_QUIZ.title}
                  subtitle={INTERVIEW_ENTRY_QUIZ.description}
                  questions={INTERVIEW_ENTRY_QUIZ.questions}
                  recommendedPass={INTERVIEW_ENTRY_QUIZ.passScore}
                  accent="fuchsia"
                  onComplete={(payload) => {
                    setEntryResult(payload);
                    setStep('core');
                  }}
                />
              </div>
            )}

            {step === 'core' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">Quiz 2 of 2</Badge>
                  <Badge className="border-white/10 bg-white/10 text-zinc-200">T-MOD Core Values Quiz</Badge>
                </div>
                <ExperimentalStaffQuiz
                  defaultName={form.fullName}
                  title={INTERVIEW_CORE_VALUES_QUIZ.title}
                  subtitle={INTERVIEW_CORE_VALUES_QUIZ.description}
                  questions={INTERVIEW_CORE_VALUES_QUIZ.questions}
                  recommendedPass={INTERVIEW_CORE_VALUES_QUIZ.passScore}
                  accent="amber"
                  onComplete={(payload) => {
                    setCoreResult(payload);
                    setStep('submit');
                  }}
                />
              </div>
            )}

            {step === 'submit' && (
              <Card className="border-white/10 bg-white/5 shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-300" /> Submit Application</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Applicant</div>
                      <div className="mt-2 text-sm font-semibold text-white">{form.fullName}</div>
                      <div className="mt-1 text-sm text-zinc-400">{form.discordName}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Quiz summary</div>
                      <div className="mt-2 space-y-1 text-sm text-zinc-200">
                        <div>{INTERVIEW_ENTRY_QUIZ.title}: {entryResult?.scorePercent ?? 0}%</div>
                        <div>{INTERVIEW_CORE_VALUES_QUIZ.title}: {coreResult?.scorePercent ?? 0}%</div>
                      </div>
                    </div>
                  </div>
                  {error && <div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
                  {info && <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-3 text-sm text-emerald-100">{info}</div>}
                  <div className="flex gap-3">
                    <Button type="button" onClick={() => setStep('core')} className="rounded-2xl border border-white/15 bg-black/30 text-zinc-100 hover:bg-white/10">
                      Back
                    </Button>
                    <Button type="button" disabled={loading || !entryResult || !coreResult} onClick={submitApplication} className="h-12 flex-1 rounded-2xl border border-emerald-400/35 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50">
                      <ClipboardCheck className="mr-2 h-4 w-4" /> {loading ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
