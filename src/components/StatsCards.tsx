import { Card, CardContent } from "@/components/ui/card";
import { Film, Users, Calendar, TrendingUp } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type VideoEdit = Tables<"video_edits">;

interface StatsCardsProps {
  edits: VideoEdit[];
  rangeActive: boolean;
  rangeDays?: number;
}

export function StatsCards({ edits, rangeActive, rangeDays = 0 }: StatsCardsProps) {
  const totalEdits = edits.reduce((sum, e) => sum + e.quantity, 0);
  const uniqueEditors = new Set(edits.map((e) => e.editor_name)).size;
  const avgPerEditor = uniqueEditors > 0 ? Math.round(totalEdits / uniqueEditors) : 0;
  const uniqueClients = new Set(edits.map((e) => e.client_name)).size;

  const now = new Date();
  const thisMonth = edits
    .filter((e) => {
      const d = new Date(e.edit_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.quantity, 0);

  const stats = [
    { label: "Total de Edições", value: totalEdits, icon: Film, color: "text-primary" },
    { label: "Média por Editor", value: avgPerEditor, icon: Users, color: "text-chart-2" },
    { label: "Clientes", value: uniqueClients, icon: TrendingUp, color: "text-chart-3" },
    rangeActive
      ? { label: "Dias no período", value: rangeDays, icon: Calendar, color: "text-chart-4" }
      : { label: "Este Mês", value: thisMonth, icon: Calendar, color: "text-chart-4" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="transition-colors hover:border-primary/30">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className={`shrink-0 rounded-lg bg-secondary p-3 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-2xl font-bold tabular-nums tracking-tight">{stat.value}</p>
              <p className="text-sm leading-tight text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
