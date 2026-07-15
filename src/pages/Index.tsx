import { useState } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useVideoEdits } from "@/hooks/useVideoEdits";
import { EditForm } from "@/components/EditForm";
import { ActiveEdits } from "@/components/ActiveEdits";
import { StatsCards } from "@/components/StatsCards";
import { DashboardCharts } from "@/components/DashboardCharts";
import { RecentEditsTable } from "@/components/RecentEditsTable";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { Film, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const Index = () => {
  const { data: edits, isLoading } = useVideoEdits();
  const { currentEditor, signOut } = useAuth();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rangeActive = from !== "" && to !== "";
  const allEdits = edits || [];
  const activeEdits = allEdits.filter(
    (e) => (e.status ?? "done") !== "done" && e.editor_name === currentEditor
  );
  const doneEdits = allEdits.filter((e) => (e.status ?? "done") === "done");
  const filteredEdits = rangeActive
    ? doneEdits.filter((e) => e.edit_date >= from && e.edit_date <= to)
    : doneEdits;
  const rangeDays = rangeActive
    ? Math.max(0, differenceInCalendarDays(parseISO(to), parseISO(from)) + 1)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20">
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
            <DateRangeFilter
              from={from}
              to={to}
              onChange={(f, t) => {
                setFrom(f);
                setTo(t);
              }}
            />
            <StatsCards edits={filteredEdits} rangeActive={rangeActive} rangeDays={rangeDays} />
            <DashboardCharts edits={filteredEdits} from={from} to={to} />
            <RecentEditsTable edits={filteredEdits} />
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
