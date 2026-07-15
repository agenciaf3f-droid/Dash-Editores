import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientCombobox } from "@/components/ClientCombobox";
import { useStartEdit } from "@/hooks/useVideoEdits";
import { Play } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type VideoFormat = Database["public"]["Enums"]["video_format"];

const FORMATS: VideoFormat[] = ["VSL", "Criativo", "Ajuste", "IA", "CTAs", "Frank", "Hook"];

export function EditForm() {
  const [clientName, setClientName] = useState("");
  const [videoFormat, setVideoFormat] = useState<VideoFormat | "">("");
  const [videoName, setVideoName] = useState("");
  const [rawLink, setRawLink] = useState("");
  const [editorName, setEditorName] = useState("");

  const startEdit = useStartEdit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !videoFormat || !videoName.trim() || !editorName) return;

    startEdit.mutate(
      {
        client_name: clientName,
        video_format: videoFormat as VideoFormat,
        editor_name: editorName,
        video_name: videoName.trim(),
        raw_link: rawLink.trim() || null,
      },
      {
        onSuccess: () => {
          setClientName("");
          setVideoFormat("");
          setVideoName("");
          setRawLink("");
          setEditorName("");
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Play className="h-5 w-5 text-primary" />
          Iniciar Edição
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2 sm:min-w-[180px] sm:flex-1">
            <Label>Cliente</Label>
            <ClientCombobox value={clientName} onChange={setClientName} />
          </div>
          <div className="space-y-2 sm:min-w-[150px] sm:flex-1">
            <Label>Tipo de Vídeo</Label>
            <Select value={videoFormat} onValueChange={(v) => setVideoFormat(v as VideoFormat)}>
              <SelectTrigger className="min-w-0">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:min-w-[180px] sm:flex-1">
            <Label htmlFor="video-name">Nome do Vídeo</Label>
            <Input
              id="video-name"
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
              placeholder="Ex.: VSL Cliente X"
              className="w-full min-w-0"
            />
          </div>
          <div className="space-y-2 sm:min-w-[180px] sm:flex-1">
            <Label htmlFor="raw-link">Link do Vídeo Bruto</Label>
            <Input
              id="raw-link"
              value={rawLink}
              onChange={(e) => setRawLink(e.target.value)}
              placeholder="https://... (opcional)"
              className="w-full min-w-0"
            />
          </div>
          <div className="space-y-2 sm:min-w-[150px] sm:flex-1">
            <Label>Editor</Label>
            <Select value={editorName} onValueChange={setEditorName}>
              <SelectTrigger className="min-w-0">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lucas">Lucas</SelectItem>
                <SelectItem value="Damião">Damião</SelectItem>
                <SelectItem value="Teste">Teste</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={startEdit.isPending} className="w-full sm:w-auto sm:min-w-[130px] sm:self-end">
            {startEdit.isPending ? "Iniciando..." : "Iniciar Edição"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
