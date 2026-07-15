import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Maps a login email -> the editor's display name.
 *
 * IMPORTANT: the resolved name MUST match the existing `editor_name` values
 * already stored in the DB (e.g. "Lucas", "Damião", "Teste") — that string is
 * what scopes the "Em Andamento" list and stamps new edits. A mismatch means an
 * editor logs in and sees an empty in-progress list even though rows exist.
 *
 * TODO(main-thread): fill real emails  (values below are PLACEHOLDERS)
 */
const EDITOR_BY_EMAIL: Record<string, string> = {
  "agenciaf3f@gmail.com": "Admin",
  "iriacridesdamiaopinhas@gmail.com": "Damião",
  "lucasmaiasct2187@gmail.com": "Lucas",
  // Novos editores: "email(minusculo)": "NomeExatoNoBanco"
};

// Emails admin: veem TUDO. Editores veem só as próprias edições.
const ADMIN_EMAILS = new Set(["agenciaf3f@gmail.com"]);

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  currentEditor: string;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;

  const currentEditor = useMemo(() => {
    if (!user) return "";
    const metaName = user.user_metadata?.name as string | undefined;
    if (metaName) return metaName;
    const email = (user.email ?? "").toLowerCase();
    if (email && EDITOR_BY_EMAIL[email]) return EDITOR_BY_EMAIL[email];
    return email.split("@")[0] ?? "";
  }, [user]);

  const isAdmin = useMemo(
    () => (user?.email ? ADMIN_EMAILS.has(user.email.toLowerCase()) : false),
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      currentEditor,
      isAdmin,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, user, loading, currentEditor, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
