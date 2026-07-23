import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { ActiveEdits } from "@/components/ActiveEdits";
import type { Tables } from "@/integrations/supabase/types";

const pauseMutate = vi.fn();
const resumeMutate = vi.fn();
const finishMutate = vi.fn();

vi.mock("@/hooks/useVideoEdits", () => ({
  usePauseEdit: () => ({ mutate: pauseMutate, isPending: false }),
  useResumeEdit: () => ({ mutate: resumeMutate, isPending: false }),
  useFinishEditing: () => ({ mutate: finishMutate, isPending: false }),
}));

// Radix relies on a few DOM APIs jsdom lacks.
beforeAll(() => {
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || (() => false);
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || (() => {});
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || (() => {});
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
});

type VideoEdit = Tables<"video_edits">;

const makeEdit = (over: Partial<VideoEdit>): VideoEdit => ({
  id: "1",
  client_name: "Cliente X",
  created_at: "2026-07-15T12:00:00Z",
  edit_date: "2026-07-15",
  editor_name: "Lucas",
  edited_link: null,
  edited_links: [],
  elapsed_seconds: 0,
  finished_at: null,
  quantity: 1,
  raw_link: null,
  raw_links: [],
  status: "editing",
  timer_started_at: null,
  video_format: "VSL",
  video_name: "Meu Vídeo",
  video_names: [],
  pauses: [],
  ...over,
});

afterEach(() => {
  cleanup();
  pauseMutate.mockClear();
  resumeMutate.mockClear();
  finishMutate.mockClear();
  vi.useRealTimers();
});

describe("ActiveEdits", () => {
  it("renders nothing when there are no active edits", () => {
    const { container } = render(<ActiveEdits edits={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows a live ticking timer while editing (banked + running)", () => {
    const system = new Date("2026-07-15T12:00:00Z").getTime();
    vi.useFakeTimers();
    vi.setSystemTime(system);

    const edit = makeEdit({
      status: "editing",
      elapsed_seconds: 10,
      timer_started_at: new Date(system - 5000).toISOString(), // running 5s
    });

    render(<ActiveEdits edits={[edit]} />);
    expect(screen.getByTestId("active-timer").textContent).toBe("15s");

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("active-timer").textContent).toBe("17s");
  });

  it("shows banked time and pause time for a paused edit", () => {
    const edit = makeEdit({
      status: "paused",
      elapsed_seconds: 42,
      timer_started_at: null,
      pauses: [{ paused_at: "2026-07-15T12:00:00Z", resumed_at: null }] as unknown as VideoEdit["pauses"],
    });
    render(<ActiveEdits edits={[edit]} />);
    expect(screen.getByTestId("active-timer").textContent).toBe("42s");
    expect(screen.getByText("Pausado", { selector: "div" })).toBeInTheDocument();
    expect(screen.getByText(/Pausado às \d{2}:\d{2}/)).toBeInTheDocument();
  });

  it("pauses immediately when Pausar is clicked (no reason dialog)", () => {
    render(<ActiveEdits edits={[makeEdit({ status: "editing", elapsed_seconds: 30 })]} />);

    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));

    expect(pauseMutate).toHaveBeenCalledTimes(1);
    expect(pauseMutate.mock.calls[0][0]).toMatchObject({ id: "1", elapsedSeconds: 30 });
    expect(pauseMutate.mock.calls[0][0].reason).toBeUndefined();
  });

  it("resumes a paused edit", () => {
    render(<ActiveEdits edits={[makeEdit({ status: "paused", elapsed_seconds: 12, timer_started_at: null })]} />);
    fireEvent.click(screen.getByRole("button", { name: "Retomar" }));
    expect(resumeMutate).toHaveBeenCalledTimes(1);
    expect(resumeMutate.mock.calls[0][0]).toMatchObject({ id: "1" });
  });

  it("freezes the timer immediately when Feito is clicked (no dialog, no link)", () => {
    render(<ActiveEdits edits={[makeEdit({ status: "editing", elapsed_seconds: 99 })]} />);

    fireEvent.click(screen.getByRole("button", { name: "Feito" }));

    expect(finishMutate).toHaveBeenCalledTimes(1);
    expect(finishMutate.mock.calls[0][0]).toMatchObject({
      id: "1",
      elapsedSeconds: 99,
    });
    // No edited link is requested at this step.
    expect(finishMutate.mock.calls[0][0].editedLink).toBeUndefined();
  });

  it("disables Feito while paused", () => {
    render(<ActiveEdits edits={[makeEdit({ status: "paused", elapsed_seconds: 20, timer_started_at: null })]} />);
    expect(screen.getByRole("button", { name: "Feito" })).toBeDisabled();
    expect(finishMutate).not.toHaveBeenCalled();
  });

  // Lote recém-criado: paused + 0s + sem pausas → nunca iniciado.
  it("shows 'Não iniciado' + Começar for a batch that was never started", () => {
    render(
      <ActiveEdits
        edits={[makeEdit({ status: "paused", elapsed_seconds: 0, timer_started_at: null, pauses: [] })]}
      />,
    );
    expect(screen.getByText("Não iniciado", { selector: "div" })).toBeInTheDocument();
    expect(screen.getByTestId("active-timer").textContent).toBe("0s");
    expect(screen.queryByText(/Pausado às/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Feito" })).toBeDisabled();

    // "Começar" reutiliza useResumeEdit com pauses vazio → nenhum intervalo é gravado.
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    expect(resumeMutate).toHaveBeenCalledTimes(1);
    expect(resumeMutate.mock.calls[0][0]).toMatchObject({ id: "1", pauses: [] });
  });

  it("keeps 'Pausado' + Retomar for a genuinely paused edit with banked time", () => {
    render(<ActiveEdits edits={[makeEdit({ status: "paused", elapsed_seconds: 12, timer_started_at: null })]} />);
    expect(screen.getByText("Pausado", { selector: "div" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Começar" })).not.toBeInTheDocument();
  });

  it("shows ×quantity for a batch of several videos", () => {
    render(<ActiveEdits edits={[makeEdit({ status: "editing", quantity: 3 })]} />);
    expect(screen.getByText("×3")).toBeInTheDocument();
  });
});
