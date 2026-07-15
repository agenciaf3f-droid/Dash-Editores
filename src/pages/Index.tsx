import { useState } from "react";
import { toast } from "sonner";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useVideoEdits } from "@/hooks/useVideoEdits";
import { EditForm } from "@/components/EditForm";
import { ActiveEdits } from "@/components/ActiveEdits";
import { AwaitingLink } from "@/components/AwaitingLink";
import { StatsCards } from "@/components/StatsCards";
import { DashboardCharts } from "@/components/DashboardCharts";
import { RecentEditsTable } from "@/components/RecentEditsTable";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { Film, LogOut, KeyRound } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InviteEditorDialog } from "@/components/InviteEditorDialog";
import { useAuth } from "@/lib/auth";

const Index = () => {
  const { data: edits, isLoading } = useVideoEdits();
  const { currentEditor, isAdmin, signOut, updatePassword } = useAuth();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("As senhas não coincidem");
      return;
    }
    setSavingPw(true);
    try {
      await updatePassword(newPw);
      toast.success("Senha alterada com sucesso");
      setPwOpen(false);
      setNewPw("");
      setConfirmPw("");
    } catch {
      toast.error("Não foi possível alterar a senha. Tente novamente.");
    } finally {
      setSavingPw(false);
    }
  };

  const rangeActive = from !== "" && to !== "";
  const allEdits = edits || [];
  // Admin vê tudo; editor vê só as próprias edições.
  const scopedEdits = isAdmin
    ? allEdits
    : allEdits.filter((e) => e.editor_name === currentEditor);
  const activeEdits = scopedEdits.filter(
    (e) => e.status === "editing" || e.status === "paused",
  );
  const awaitingEdits = scopedEdits.filter((e) => e.status === "awaiting_link");
  const doneEdits = scopedEdits.filter((e) => (e.status ?? "done") === "done");
  const filteredEdits = rangeActive
    ? doneEdits.filter((e) => e.edit_date >= from && e.edit_date <= to)
    : doneEdits;
  const rangeDays = rangeActive
    ? Math.max(0, differenceInCalendarDays(parseISO(to), parseISO(from)) + 1)
    : 0;

  return (
    <div className="app-shell min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/70 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 ring-1 ring-primary/25 shadow-[0_0_24px_-8px_hsl(174_72%_50%/0.8)]">
            <Film className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold tracking-tight">Controle de Edição</h1>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Agência F3F</p>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {currentEditor && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                Editor: <span className="font-medium text-foreground">{currentEditor}</span>
              </span>
            )}
            {isAdmin && <InviteEditorDialog />}
            <Dialog open={pwOpen} onOpenChange={setPwOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <KeyRound className="h-4 w-4" />
                  <span className="hidden sm:inline">Trocar senha</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Trocar senha</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="change-new-password">Nova senha</Label>
                    <Input
                      id="change-new-password"
                      type="password"
                      autoComplete="new-password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="change-confirm-password">Confirmar senha</Label>
                    <Input
                      id="change-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={savingPw} className="w-full">
                      {savingPw ? "Salvando..." : "Salvar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 sm:px-6 sm:py-8 sm:space-y-8">
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : (
          <>
            <EditForm />
            <ActiveEdits edits={activeEdits} />
            <AwaitingLink edits={awaitingEdits} />
            <DateRangeFilter
              from={from}
              to={to}
              onChange={(f, t) => {
                setFrom(f);
                setTo(t);
              }}
            />
            <StatsCards edits={filteredEdits} rangeActive={rangeActive} rangeDays={rangeDays} />
            <DashboardCharts edits={filteredEdits} from={from} to={to} isAdmin={isAdmin} />
            <RecentEditsTable edits={filteredEdits} />
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
