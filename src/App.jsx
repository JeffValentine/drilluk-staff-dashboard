import { useCallback, useEffect, useMemo, useState } from "react";
import DrillUKStaffTrackerPrototype from "./DrillUKStaffTrackerPrototype";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

function LoginScreen({ error, info, onSignIn, onSignUp }) {
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
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
        <form onSubmit={submit} className="w-full rounded-2xl border border-white/10 bg-white/5 p-6">
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
      .select("id, username, role, is_active, avatar_url, god_key_enabled")
      .eq("id", session.user.id)
      .single();

    if (profileError?.code === "42703") {
      const { data: fallbackData } = await supabase
        .from("profiles")
        .select("id, username, role, is_active")
        .eq("id", session.user.id)
        .single();
      if (fallbackData) {
        setProfile({ ...fallbackData, avatar_url: null, god_key_enabled: false });
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

    const { data, error: signUpError } = await supabase.auth.signUp({
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

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 text-zinc-200 p-6">Loading...</div>;
  }

  if (!session) {
    return <LoginScreen error={error} info={info} onSignIn={signIn} onSignUp={signUp} />;
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
