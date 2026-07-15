import type { CSSProperties } from "react";
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

  // Each metric carries its own brand accent (H S L channels) so the row reads as a
  // vibrant instrument panel rather than four identical gray slabs.
  const stats = [
    { label: "Total de Edições", value: totalEdits, icon: Film, accent: "174 72% 50%" },
    { label: "Média por Editor", value: avgPerEditor, icon: Users, accent: "262 60% 58%" },
    { label: "Clientes", value: uniqueClients, icon: TrendingUp, accent: "40 90% 55%" },
    rangeActive
      ? { label: "Dias no período", value: rangeDays, icon: Calendar, accent: "340 70% 55%" }
      : { label: "Este Mês", value: thisMonth, icon: Calendar, accent: "340 70% 55%" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{ "--a": stat.accent } as CSSProperties}
          className="group relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-b from-card to-[hsl(var(--card-bottom))] p-4 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.05),0_10px_30px_-16px_hsl(0_0%_0%/0.6)] transition-all duration-300 hover:border-[hsl(var(--a)/0.45)] hover:shadow-[0_14px_40px_-18px_hsl(var(--a)/0.55)] sm:p-5"
        >
          {/* Accent-lit top edge */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, hsl(var(--a) / 0.75), transparent)" }}
          />
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className="shrink-0 rounded-xl p-3 ring-1 ring-[hsl(var(--a)/0.3)]"
              style={{
                backgroundColor: "hsl(var(--a) / 0.12)",
                color: "hsl(var(--a))",
                boxShadow: "0 0 22px -8px hsl(var(--a) / 0.6)",
              }}
            >
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-3xl font-bold leading-none tabular-nums tracking-tight sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1.5 text-[11px] font-medium uppercase leading-tight tracking-wider text-muted-foreground">
                {stat.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
