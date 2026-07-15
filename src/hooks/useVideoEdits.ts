import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Pause = {
  // Legacy rows may carry a reason; the app no longer writes or reads it.
  reason?: string;
  paused_at: string;
  resumed_at: string | null;
};

const today = () => new Date().toISOString().split("T")[0];

export function useVideoEdits() {
  return useQuery({
    queryKey: ["video-edits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_edits")
        .select("*")
        .order("edit_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

type StartEditInput = {
  client_name: string;
  video_format: TablesInsert<"video_edits">["video_format"];
  editor_name: string;
  video_name: string;
  raw_link: string | null;
};

export function useStartEdit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StartEditInput) => {
      const { data, error } = await supabase
        .from("video_edits")
        .insert({
          status: "editing",
          timer_started_at: new Date().toISOString(),
          elapsed_seconds: 0,
          client_name: input.client_name,
          video_format: input.video_format,
          editor_name: input.editor_name,
          video_name: input.video_name,
          raw_link: input.raw_link,
          edit_date: today(),
          quantity: 1,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-edits"] });
      toast.success("Edição iniciada!");
    },
    onError: () => {
      toast.error("Erro ao iniciar edição");
    },
  });
}

export function usePauseEdit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      elapsedSeconds,
      pauses,
    }: {
      id: string;
      elapsedSeconds: number;
      pauses: Pause[];
    }) => {
      const nextPauses: Pause[] = [
        ...pauses,
        { paused_at: new Date().toISOString(), resumed_at: null },
      ];
      const { error } = await supabase
        .from("video_edits")
        .update({
          status: "paused",
          elapsed_seconds: elapsedSeconds,
          timer_started_at: null,
          pauses: nextPauses as unknown as Json,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-edits"] });
      toast.success("Edição pausada");
    },
    onError: () => {
      toast.error("Erro ao pausar edição");
    },
  });
}

export function useResumeEdit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pauses }: { id: string; pauses: Pause[] }) => {
      const nextPauses = pauses.map((p, i) =>
        i === pauses.length - 1 ? { ...p, resumed_at: new Date().toISOString() } : p
      );
      const { error } = await supabase
        .from("video_edits")
        .update({
          status: "editing",
          timer_started_at: new Date().toISOString(),
          pauses: nextPauses as unknown as Json,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-edits"] });
      toast.success("Edição retomada");
    },
    onError: () => {
      toast.error("Erro ao retomar edição");
    },
  });
}

export function useFinishEdit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      editedLink,
      elapsedSeconds,
    }: {
      id: string;
      editedLink: string;
      elapsedSeconds: number;
    }) => {
      const { error } = await supabase
        .from("video_edits")
        .update({
          status: "done",
          elapsed_seconds: elapsedSeconds,
          timer_started_at: null,
          edited_link: editedLink,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-edits"] });
      toast.success("Edição finalizada!");
    },
    onError: () => {
      toast.error("Erro ao finalizar edição");
    },
  });
}

export function useDeleteVideoEdit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("video_edits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-edits"] });
      toast.success("Edição removida!");
    },
    onError: () => {
      toast.error("Erro ao remover edição");
    },
  });
}
