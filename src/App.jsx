import { useCallback, useEffect, useMemo, useState } from "react";
import DrillUKStaffTrackerPrototype from "./DrillUKStaffTrackerPrototype";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

function LoginScreen({ error, info, onSignIn, onSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState("signin");

  async function submit(e) {
    e.preventDefault();
    if (mode === "signin") {
      await onSignIn(email, password);
      return;
    }
    await onSignUp(email, password, username);
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
        <form onSubmit={submit} className="w-full rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="font-display text-2xl font-bold">{mode === "signin" ? "Staff Login" : "Create Account"}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {mode === "signin"
              ? "Sign in to access the protected Drill-UK dashboard."
              : "Create an account. New users are automatically tagged as Guest."}
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
              onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
              className="h-10 w-full rounded-md border border-white/15 bg-black/25 text-sm text-zinc-200 hover:bg-white/10"
            >
              {mode === "signin" ? "Create account instead" : "Back to sign in"}
            </button>
          </div>
        </form>
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
      .select("id, username, role, is_active, avatar_url")
      .eq("id", session.user.id)
      .single();

    if (profileError?.code === "42703") {
      const { data: fallbackData } = await supabase
        .from("profiles")
        .select("id, username, role, is_active")
        .eq("id", session.user.id)
        .single();
      if (fallbackData) {
        setProfile({ ...fallbackData, avatar_url: null });
        return;
      }
    }

    if (profileError) {
      const fallback = {
        id: session.user.id,
        username: session.user.email?.split("@")[0] ?? "user",
        role: "viewer",
        is_active: true,
        avatar_url: null,
      };
      setProfile(fallback);
      return;
    }

    setProfile(data);
  }, [session]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const canAccessDashboard = useMemo(() => {
    if (!session || !profile) return false;
    if (!profile.is_active) return false;
    return ["head_admin", "admin", "trainer", "viewer"].includes(profile.role);
  }, [session, profile]);

  async function signIn(email, password) {
    setError("");
    setInfo("");
    if (!supabase) return;
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
  }

  async function signUp(email, password, username) {
    setError("");
    setInfo("");
    if (!supabase) return;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username?.trim() || email.split("@")[0],
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setInfo("Account created. You can now sign in (or confirm email if your project requires verification).");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 text-zinc-200 p-6">Loading...</div>;
  }

  if (!session || !canAccessDashboard) {
    return <LoginScreen error={error} info={info} onSignIn={signIn} onSignUp={signUp} />;
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
