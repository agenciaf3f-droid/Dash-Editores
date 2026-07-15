import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pause as PauseIcon, Play, CheckCircle2, Timer } from "lucide-react";
import { usePauseEdit, useResumeEdit, useFinishEdit, type Pause } from "@/hooks/useVideoEdits";
import { formatDuration } from "@/lib/time";
import type { Tables } from "@/integrations/supabase/types";

type VideoEdit = Tables<"video_edits">;

interface ActiveEditsProps {
  edits: VideoEdit[];
}

export function ActiveEdits({ edits }: ActiveEditsProps) {
  if (edits.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-heading font-semibold">
        <Timer className="h-5 w-5 text-primary" />
        Em Andamento
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {edits.map((edit) => (
          <ActiveEditCard key={edit.id} edit={edit} />
        ))}
      </div>
    </section>
  );
}

function ActiveEditCard({ edit }: { edit: VideoEdit }) {
  const pauseEdit = usePauseEdit();
  const resumeEdit = useResumeEdit();
  const finishEdit = useFinishEdit();

  const isEditing = edit.status === "editing";
  const pauses = (edit.pauses as unknown as Pause[]) ?? [];
  const lastReason =
    edit.status === "paused" && pauses.length > 0 ? pauses[pauses.length - 1].reason : null;

  // Live ticking clock: re-render every second while running.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isEditing) return;
    setNow(Date.now()); // sync immediately so resuming doesn't briefly dip
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isEditing]);

  // Safety net: if this card unmounts mid-dialog-close, ensure Radix's body
  // pointer-events lock can never be stranded (black-screen guard).
  useEffect(() => () => {
    document.body.style.pointerEvents = "";
  }, []);

  const elapsed =
    (edit.elapsed_seconds ?? 0) +
    (isEditing && edit.timer_started_at ? (now - Date.parse(edit.timer_started_at)) / 1000 : 0);

  // Pause dialog
  const [pauseOpen, setPauseOpen] = useState(false);
  const [reason, setReason] = useState("");
  const handleConfirmPause = () => {
    if (!reason.trim()) return;
    // Close before mutating so the card can safely unmount later without stranding
    // Radix's body pointer-events cleanup.
    setPauseOpen(false);
    pauseEdit.mutate({
      id: edit.id,
      reason: reason.trim(),
      elapsedSeconds: Math.round(elapsed),
      pauses,
    });
    setReason("");
  };

  const handleResume = () => {
    resumeEdit.mutate({ id: edit.id, pauses });
  };

  // Finish dialog
  const [finishOpen, setFinishOpen] = useState(false);
  const [editedLink, setEditedLink] = useState("");
  const handleConfirmFinish = () => {
    if (!editedLink.trim()) return;
    // Close synchronously first: finishing removes this edit from the active list,
    // which unmounts this card. Closing before the refetch avoids the pointer-events bug.
    setFinishOpen(false);
    finishEdit.mutate({
      id: edit.id,
      editedLink: editedLink.trim(),
      elapsedSeconds: Math.round(elapsed),
    });
    setEditedLink("");
  };

  return (
    <Card data-testid="active-edit-card">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{edit.video_name || "Sem nome"}</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {edit.client_name} · {edit.editor_name}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary">{edit.video_format}</Badge>
            <Badge variant={isEditing ? "default" : "outline"}>
              {isEditing ? "Editando" : "Pausado"}
            </Badge>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span
            data-testid="active-timer"
            className="font-heading text-3xl font-bold tabular-nums tracking-tight"
          >
            {formatDuration(elapsed)}
          </span>
        </div>

        {lastReason && (
          <p className="truncate text-xs text-muted-foreground">
            Pausado: <span className="text-foreground">{lastReason}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setPauseOpen(true)}>
              <PauseIcon className="mr-1.5 h-4 w-4" />
              Pausar
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResume}
              disabled={resumeEdit.isPending}
            >
              <Play className="mr-1.5 h-4 w-4" />
              Retomar
            </Button>
          )}
          <Button size="sm" onClick={() => setFinishOpen(true)}>
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Finalizar
          </Button>
        </div>
      </CardContent>

      {/* Pause dialog — requires a non-empty reason */}
      <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pausar edição</DialogTitle>
            <DialogDescription>Informe o motivo da pausa para continuar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`pause-reason-${edit.id}`}>Motivo</Label>
            <Input
              id={`pause-reason-${edit.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: almoço, reunião..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirmPause();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPause}
              disabled={!reason.trim() || pauseEdit.isPending}
            >
              Confirmar pausa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finish dialog — asks if ready, requires the edited link */}
      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vídeo está pronto?</DialogTitle>
            <DialogDescription>
              Informe o link do vídeo editado para finalizar. Se ainda não estiver pronto, feche
              e continue depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`edited-link-${edit.id}`}>Link do Vídeo Editado</Label>
            <Input
              id={`edited-link-${edit.id}`}
              value={editedLink}
              onChange={(e) => setEditedLink(e.target.value)}
              placeholder="https://..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirmFinish();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishOpen(false)}>
              Não pronto
            </Button>
            <Button
              onClick={handleConfirmFinish}
              disabled={!editedLink.trim() || finishEdit.isPending}
            >
              Sim, pronto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
