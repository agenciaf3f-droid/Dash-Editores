import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Film } from "lucide-react";

export function Login() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<"login" | "recover">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      toast.error("Email ou senha inválidos");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + "/redefinir-senha",
      });
    } catch {
      // Ignore: never leak whether the email exists.
    } finally {
      // Always the same neutral message, success or failure.
      toast.success("Se o email existir, enviamos um link para redefinir a senha");
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm border-border/60 shadow-2xl shadow-black/40">
        <CardHeader className="items-center space-y-3 text-center">
          <div className="rounded-xl bg-primary/10 p-2.5 ring-1 ring-primary/25 shadow-[0_0_28px_-6px_hsl(174_72%_50%/0.85)]">
            <Film className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-heading font-bold tracking-tight">Controle de Edição</h1>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Agência F3F</p>
          </div>
        </CardHeader>
        <CardContent>
          {mode === "login" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@f3f.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Entrando..." : "Entrar"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("recover")}
                className="block w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Esqueci minha senha
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecover} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Informe seu email e enviaremos um link para redefinir a senha.
              </p>
              <div className="space-y-2">
                <Label htmlFor="recover-email">Email</Label>
                <Input
                  id="recover-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@f3f.com.br"
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Enviando..." : "Enviar link"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="block w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Voltar ao login
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
