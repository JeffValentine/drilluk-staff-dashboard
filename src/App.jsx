import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ClipboardCheck, ShieldCheck } from "lucide-react";
import DrillUKStaffTrackerPrototype from "./DrillUKStaffTrackerPrototype";
import PublicInterviewFlow from "./components/PublicInterviewFlow";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

function LoginScreen({ error, info, onSignIn, onSignUp, onOpenInterview }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [tokenPromptOpen, setTokenPromptOpen] = useState(false);
  const [mode, setMode] = useState("signin");

  async function submit(e) {
    e.preventDefault();
    if (mode === "signin") {
      await onSignIn(email, password);
      return;
    }
    setTokenPromptOpen(true);
  }

  async function submitWithToken(e) {
    e.preventDefault();
    await onSignUp(email, password, username, signupToken);
    setTokenPromptOpen(false);
    setSignupToken("");
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10">
        <div className="grid w-full gap-6 xl:grid-cols-[1.04fr,0.96fr]">
          <div className="rounded-[30px] border border-fuchsia-500/20 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.22),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-fuchsia-100">
              <ShieldCheck className="h-3.5 w-3.5" /> Drill UK Staff
            </div>
            <h1 className="mt-5 font-display text-5xl font-bold leading-tight text-white">Staff Login and Public Interview Portal</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
              Existing staff can sign in here. New applicants can submit their details here first, then Head of Staff can run the live scored interview from inside the dashboard.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Interview</div>
                <div className="mt-2 text-sm font-semibold text-white">Application details</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Quiz 1</div>
                <div className="mt-2 text-sm font-semibold text-white">Head of Staff review</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Quiz 2</div>
                <div className="mt-2 text-sm font-semibold text-white">Live scored interview</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenInterview}
              className="mt-6 flex w-full items-center justify-between rounded-[28px] border border-cyan-400/30 bg-[linear-gradient(135deg,rgba(14,116,144,0.26),rgba(217,70,239,0.18))] px-6 py-5 text-left shadow-[0_24px_70px_rgba(0,0,0,0.34)] transition hover:border-cyan-300/45 hover:bg-[linear-gradient(135deg,rgba(14,116,144,0.34),rgba(217,70,239,0.24))]"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                  <ClipboardCheck className="h-4 w-4" /> Start Staff Interview
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">Apply for staff before login</div>
                <div className="mt-2 max-w-xl text-sm leading-6 text-zinc-300">
                  Submit your details first. Head of Staff can then open the applicant in the interview panel and run the full point-based interview live.
                </div>
              </div>
              <ArrowUpRight className="h-6 w-6 shrink-0 text-cyan-100" />
            </button>
          </div>

          <form onSubmit={submit} className="w-full rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.4)]">
            <h1 className="font-display text-2xl font-bold">{mode === "signin" ? "Staff Login" : "Create Account"}</h1>
            <p className="mt-2 text-sm text-zinc-400">
              {mode === "signin"
                ? "Sign in to access the protected Drill-UK dashboard."
                : "Create an account. New users are pending approval by Head of Staff."}
            </p>
            {!isSupabaseConfigured && (
              <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
                Supabase is not configured. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">{error}</div>
            )}
            {info && (
              <div className="mt-4 rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3 text-xs text-emerald-200">{info}</div>
            )}
            <div className="mt-4 space-y-3">
              {mode === "signup" && (
                <input
                  className="h-10 w-full rounded-md border border-zinc-700 bg-transparent px-3 text-sm"
                  type="text"
                  placeholder="Username (optional)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              )}
              <input
                className="h-10 w-full rounded-md border border-zinc-700 bg-transparent px-3 text-sm"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="h-10 w-full rounded-md border border-zinc-700 bg-transparent px-3 text-sm"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="h-10 w-full rounded-md bg-fuchsia-600 text-sm font-medium text-white hover:bg-fuchsia-500 disabled:opacity-50"
                type="submit"
                disabled={!isSupabaseConfigured}
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode((m) => (m === "signin" ? "signup" : "signin"));
                  setTokenPromptOpen(false);
                  setSignupToken("");
                }}
                className="h-10 w-full rounded-md border border-white/15 bg-black/25 text-sm text-zinc-200 hover:bg-white/10"
              >
                {mode === "signin" ? "Create account instead" : "Back to sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
      {tokenPromptOpen && mode === "signup" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <form
            onSubmit={submitWithToken}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1018] p-5"
          >
            <div className="text-lg font-semibold text-white">Invite Token Required</div>
            <p className="mt-1 text-sm text-zinc-400">
              Enter your one-time token from Head Admin to create an account.
            </p>
            <input
              className="mt-4 h-10 w-full rounded-md border border-zinc-700 bg-transparent px-3 text-sm"
              type="text"
              placeholder="One-time token"
              value={signupToken}
              onChange={(e) => setSignupToken(e.target.value)}
              required
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="submit"
                className="h-10 rounded-md bg-fuchsia-600 text-sm font-medium text-white hover:bg-fuchsia-500"
              >
                Verify & create
              </button>
              <button
                type="button"
                onClick={() => setTokenPromptOpen(false)}
                className="h-10 rounded-md border border-white/15 bg-black/25 text-sm text-zinc-200 hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function PendingApprovalScreen({ profile, onSignOut }) {
  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="font-display text-2xl font-bold">Approval Pending</h1>
          <p className="mt-2 text-sm text-zinc-400">
            You are awaiting approval by the Head of Staff before dashboard access is granted.
          </p>
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
            Account: {profile?.username || "Guest"} ({profile?.role || "viewer"})
          </div>
          <button
            className="mt-4 h-10 w-full rounded-md border border-white/15 bg-black/25 text-sm text-zinc-200 hover:bg-white/10"
            type="button"
            onClick={onSignOut}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [interviewSubmitting, setInterviewSubmitting] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = useCallback(async () => {
    if (!session?.user || !supabase) {
      setProfile(null);
      return;
    }

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, role, is_active, avatar_url, god_key_enabled, experimental_quiz_enabled")
      .eq("id", session.user.id)
      .single();

    if (profileError?.code === "42703") {
      const { data: fallbackData } = await supabase
        .from("profiles")
        .select("id, username, role, is_active")
        .eq("id", session.user.id)
        .single();
      if (fallbackData) {
        setProfile({ ...fallbackData, avatar_url: null, god_key_enabled: false, experimental_quiz_enabled: false });
        return;
      }
    }

    if (profileError) {
      const fallback = {
        id: session.user.id,
        username: session.user.email?.split("@")[0] ?? "user",
        role: "viewer",
        is_active: false,
        avatar_url: null,
        god_key_enabled: false,
      };
      setProfile(fallback);
      return;
    }

    setProfile(data);
  }, [session]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!session?.user || !supabase) return;
    const channel = supabase
      .channel("profile_self_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${session.user.id}` },
        () => {
          loadProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, loadProfile]);

  const canAccessDashboard = useMemo(() => {
    if (!session || !profile) return false;
    if (!profile.is_active) return false;
    return ["head_admin", "admin", "trainer", "staff_in_training"].includes(profile.role);
  }, [session, profile]);

  async function signIn(email, password) {
    setError("");
    setInfo("");
    if (!supabase) return;
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
  }

  async function signUp(email, password, username, signupToken) {
    setError("");
    setInfo("");
    if (!supabase) return;

    const cleanedToken = String(signupToken || "").trim();
    if (!cleanedToken) {
      setError("Invite token is required.");
      return;
    }

    const { data: tokenOk, error: tokenError } = await supabase.rpc("consume_signup_token", {
      token_input: cleanedToken,
      claimant_email: email,
    });

    if (tokenError) {
      setError(tokenError.message || "Token verification failed.");
      return;
    }

    if (!tokenOk) {
      setError("Invalid or already used token.");
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          username: username?.trim() || email.split("@")[0],
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setInfo("Account created. After sign-in, your account will stay locked until Head of Staff approval.");
  }

  const submitInterviewApplication = useCallback(async ({ form, entryResult, coreResult }) => {
    setError("");
    setInfo("");
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setInterviewSubmitting(true);
    const payload = {
      full_name: String(form.fullName || "").trim(),
      discord_name: String(form.discordName || "").trim(),
      age: Number(form.age || 0),
      country: String(form.country || "").trim(),
      hours_per_week: Number(form.hoursPerWeek || 0),
      prior_bans: String(form.priorBans || "").trim(),
      staff_experience: String(form.staffExperience || "").trim(),
      why_staff: String(form.whyStaff || "").trim(),
      why_drill: String(form.whyDrill || "").trim(),
      entry_quiz_result: {},
      core_quiz_result: {},
    };

    const { error: insertError } = await supabase.from("interview_applications").insert(payload);
    setInterviewSubmitting(false);

    if (insertError) {
      setError(insertError.message || "Failed to submit interview application.");
      return;
    }

    setInterviewOpen(false);
    setInfo("Interview application submitted. Head Admin can now review the applicant details and start the live scored interview.");
  }, []);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 p-6 text-zinc-200">Loading...</div>;
  }

  if (!session) {
    if (interviewOpen) {
      return (
        <PublicInterviewFlow
          onBack={() => {
            setInterviewOpen(false);
            setError("");
          }}
          onSubmit={submitInterviewApplication}
          loading={interviewSubmitting}
          error={error}
          info={info}
        />
      );
    }
    return (
      <LoginScreen
        error={error}
        info={info}
        onSignIn={signIn}
        onSignUp={signUp}
        onOpenInterview={() => {
          setError("");
          setInfo("");
          setInterviewOpen(true);
        }}
      />
    );
  }

  if (!profile) {
    return <div className="min-h-screen bg-zinc-950 p-6 text-zinc-200">Loading account...</div>;
  }

  if (!canAccessDashboard) {
    return <PendingApprovalScreen profile={profile} onSignOut={signOut} />;
  }

  return (
    <DrillUKStaffTrackerPrototype
      authUser={session.user}
      profile={profile}
      onSignOut={signOut}
      dbReady={isSupabaseConfigured}
      onProfileRefresh={loadProfile}
    />
  );
}
