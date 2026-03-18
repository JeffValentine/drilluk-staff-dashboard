import React, { useMemo, useState } from 'react';
import { ArrowLeft, FileText, ShieldCheck, UserRoundPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { INTERVIEW_FORM_FIELDS, INTERVIEW_LONG_FIELDS } from '@/interviewQuestionBank';

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
  const [form, setForm] = useState(emptyForm());
  const readiness = useMemo(() => {
    const fields = [...INTERVIEW_FORM_FIELDS, ...INTERVIEW_LONG_FIELDS];
    const completed = fields.filter((field) => String(form[field.key] || '').trim()).length;
    return Math.round((completed / fields.length) * 100);
  }, [form]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitForm(event) {
    event.preventDefault();
    const requiredFilled = [...INTERVIEW_FORM_FIELDS, ...INTERVIEW_LONG_FIELDS].every((field) => String(form[field.key] || '').trim());
    if (!requiredFilled) return;
    await onSubmit({ form });
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
                Submit your application details here first. Head of Staff will review the information, then start the live point-based interview from the dashboard.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Step 1</div>
                  <div className="mt-2 text-sm font-semibold text-white">Submit application info</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Step 2</div>
                  <div className="mt-2 text-sm font-semibold text-white">Head of Staff review</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Step 3</div>
                  <div className="mt-2 text-sm font-semibold text-white">Live point interview</div>
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
                <div className="mt-3 text-sm text-zinc-400">No quiz is required at this stage. Head of Staff starts the scored interview later.</div>
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

          <Card className="border-white/10 bg-white/5 shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-cyan-300" /> Interview Application</CardTitle>
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
                {error && <div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
                {info && <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-3 text-sm text-emerald-100">{info}</div>}
                <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl border border-fuchsia-400/35 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:from-fuchsia-500 hover:to-indigo-500 disabled:opacity-50">
                  <ShieldCheck className="mr-2 h-4 w-4" /> {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
