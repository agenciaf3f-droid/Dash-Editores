import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from "recharts";
import type { TooltipProps } from "recharts";
import type { Tables } from "@/integrations/supabase/types";
import {
  startOfWeek,
  startOfMonth,
  format,
  subDays,
  subWeeks,
  subMonths,
  isAfter,
  parseISO,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  addDays,
  addMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

type VideoEdit = Tables<"video_edits">;

interface DashboardChartsProps {
  edits: VideoEdit[];
  from?: string;
  to?: string;
}

const COLORS = [
  "hsl(174, 72%, 50%)",
  "hsl(262, 60%, 58%)",
  "hsl(40, 90%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(200, 80%, 55%)",
  "hsl(150, 60%, 48%)",
  "hsl(20, 85%, 58%)",
];

const EDITOR_COLORS: Record<string, string> = {
  Lucas: "hsl(174, 72%, 50%)",
  Damião: "hsl(262, 60%, 58%)",
};

type Period = "day" | "week" | "month";

const tooltipStyle = {
  backgroundColor: "hsl(220, 18%, 12%)",
  border: "1px solid hsl(220, 14%, 18%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
};

export function DashboardCharts({ edits, from, to }: DashboardChartsProps) {
  const [period, setPeriod] = useState<Period>("day");
  const [byEditorMode, setByEditorMode] = useState(false);

  const rangeActive = !!from && !!to && from <= to;

  // Edits by editor
  const byEditor = Object.entries(
    edits.reduce<Record<string, number>>((acc, e) => {
      acc[e.editor_name] = (acc[e.editor_name] || 0) + e.quantity;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count }));

  // Edits by format
  const byFormat = Object.entries(
    edits.reduce<Record<string, number>>((acc, e) => {
      acc[e.video_format] = (acc[e.video_format] || 0) + e.quantity;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const formatTotal = byFormat.reduce((s, f) => s + f.value, 0);
  const formatColor = (name: string) =>
    COLORS[byFormat.findIndex((f) => f.name === name) % COLORS.length];

  const PieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) return null;
    const { name, value } = payload[0].payload as { name: string; value: number };
    const pct = formatTotal > 0 ? Math.round((value / formatTotal) * 100) : 0;
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: formatColor(name) }} />
          <span className="font-medium text-foreground">{name}</span>
        </div>
        <p className="mt-1 tabular-nums text-muted-foreground">
          {value} {value === 1 ? "edição" : "edições"} · {pct}%
        </p>
      </div>
    );
  };

  // Timeline data based on period and editor grouping
  const timelineData = useMemo(() => {
    const now = new Date();
    const editors = ["Lucas", "Damião"];

    // Build one chart row from a label and the edits falling in that bucket.
    const makeRow = (label: string, bucketEdits: VideoEdit[]) => {
      if (byEditorMode) {
        const row: Record<string, string | number> = { date: label };
        editors.forEach((ed) => {
          row[ed] = bucketEdits
            .filter((e) => e.editor_name === ed)
            .reduce((s, e) => s + e.quantity, 0);
        });
        return row;
      }
      return { date: label, count: bucketEdits.reduce((s, e) => s + e.quantity, 0) };
    };

    // Bucket edits whose date falls in [start, end) (half-open).
    const inBucket = (start: Date, end: Date) =>
      edits.filter((e) => {
        const d = parseISO(e.edit_date);
        return !isAfter(start, d) && isAfter(end, d);
      });

    if (period === "day") {
      const days = rangeActive
        ? eachDayOfInterval({ start: parseISO(from!), end: parseISO(to!) }).map((d) =>
            format(d, "yyyy-MM-dd")
          )
        : Array.from({ length: 30 }, (_, i) => format(subDays(now, 29 - i), "yyyy-MM-dd"));

      return days.map((date) =>
        makeRow(date.slice(5), edits.filter((e) => e.edit_date === date))
      );
    }

    if (period === "week") {
      const starts = rangeActive
        ? eachWeekOfInterval({ start: parseISO(from!), end: parseISO(to!) }, { weekStartsOn: 1 })
        : Array.from({ length: 12 }, (_, i) => startOfWeek(subWeeks(now, 11 - i), { weekStartsOn: 1 }));

      return starts.map((ws, idx) => {
        const end = rangeActive
          ? addDays(ws, 7)
          : idx < starts.length - 1
            ? starts[idx + 1]
            : now;
        return makeRow(format(ws, "dd/MM", { locale: ptBR }), inBucket(ws, end));
      });
    }

    // month
    const starts = rangeActive
      ? eachMonthOfInterval({ start: parseISO(from!), end: parseISO(to!) })
      : Array.from({ length: 12 }, (_, i) => startOfMonth(subMonths(now, 11 - i)));

    return starts.map((ms, idx) => {
      const end = rangeActive
        ? addMonths(ms, 1)
        : idx < starts.length - 1
          ? starts[idx + 1]
          : now;
      return makeRow(format(ms, "MMM", { locale: ptBR }), inBucket(ms, end));
    });
  }, [edits, period, byEditorMode, rangeActive, from, to]);

  const periodLabel = period === "day" ? "30 dias" : period === "week" ? "12 semanas" : "12 meses";
  const timelineTitle = rangeActive
    ? `De ${format(parseISO(from!), "dd/MM")} até ${format(parseISO(to!), "dd/MM")}`
    : `Edições nos últimos ${periodLabel}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Area chart - timeline */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-col gap-3 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{timelineTitle}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["day", "week", "month"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    period === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {p === "day" ? "Dia" : p === "week" ? "Semana" : "Mês"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setByEditorMode(!byEditorMode)}
              className={`px-3 py-1 text-xs font-medium rounded-lg border border-border transition-colors ${
                byEditorMode
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              Por Editor
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={timelineData}>
              <defs>
                {byEditorMode ? (
                  <>
                    <linearGradient id="colorLucas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={EDITOR_COLORS.Lucas} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={EDITOR_COLORS.Lucas} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDamiao" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={EDITOR_COLORS.Damião} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={EDITOR_COLORS.Damião} stopOpacity={0} />
                    </linearGradient>
                  </>
                ) : (
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(174, 72%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(174, 72%, 50%)" stopOpacity={0} />
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="date" stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              {byEditorMode ? (
                <>
                  <Area type="monotone" dataKey="Lucas" stroke={EDITOR_COLORS.Lucas} fillOpacity={1} fill="url(#colorLucas)" />
                  <Area type="monotone" dataKey="Damião" stroke={EDITOR_COLORS.Damião} fillOpacity={1} fill="url(#colorDamiao)" />
                  <Legend wrapperStyle={{ color: "hsl(210, 20%, 92%)" }} />
                </>
              ) : (
                <Area type="monotone" dataKey="count" stroke="hsl(174, 72%, 50%)" fillOpacity={1} fill="url(#colorCount)" name="Edições" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie chart - format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por Formato</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-center">
          {byFormat.length > 0 ? (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={byFormat}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={90}
                      paddingAngle={byFormat.length > 1 ? 2 : 0}
                      dataKey="value"
                      nameKey="name"
                      stroke="hsl(220, 18%, 10%)"
                      strokeWidth={2}
                    >
                      {byFormat.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading text-3xl font-bold leading-none tabular-nums">
                    {formatTotal}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">edições</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                {byFormat.map((f, i) => (
                  <div key={f.name} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{f.name}</span>
                    <span className="font-medium tabular-nums">{f.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground text-sm">Sem dados</p>
          )}
        </CardContent>
      </Card>

      {/* Bar chart - by editor */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Edições por Editor</CardTitle>
        </CardHeader>
        <CardContent>
          {byEditor.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byEditor}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Edições" radius={[6, 6, 0, 0]}>
                  {byEditor.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm">Sem dados</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
