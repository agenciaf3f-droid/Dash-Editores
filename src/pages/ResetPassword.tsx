import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Film, Loader2 } from "lucide-react";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm border-border/60 shadow-2xl shadow-black/40">
        <CardHeader className="items-center space-y-3 text-center">
          <div className="rounded-xl bg-primary/10 p-2.5 ring-1 ring-primary/25 shadow-[0_0_28px_-6px_hsl(174_72%_50%/0.85)]">
            <Film className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-heading font-bold tracking-tight">Definir senha</h1>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Agência F3F</p>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

const ResetPassword = () => {
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      toast.success("Senha definida com sucesso");
      navigate("/", { replace: true });
    } catch {
      toast.error("Não foi possível salvar a senha. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <Shell>
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Link inválido ou expirado. Solicite um novo link para definir sua senha.
          </p>
          <Link
            to="/"
            className="inline-block text-sm text-primary underline-offset-4 hover:underline"
          >
            Voltar ao login
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">Nova senha</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar senha</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>
    </Shell>
  );
};

export default ResetPassword;
