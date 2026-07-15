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
  useFinishEdit: () => ({ mutate: finishMutate, isPending: false }),
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
  elapsed_seconds: 0,
  quantity: 1,
  raw_link: null,
  status: "editing",
  timer_started_at: null,
  video_format: "VSL",
  video_name: "Meu Vídeo",
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

  it("blocks Finalizar until an edited link is provided, then finishes", () => {
    render(<ActiveEdits edits={[makeEdit({ status: "editing", elapsed_seconds: 99 })]} />);

    fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));
    expect(screen.getByText("Vídeo está pronto?")).toBeInTheDocument();

    const confirm = screen.getByRole("button", { name: "Sim, pronto" });
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Link do Vídeo Editado"), {
      target: { value: "https://example.com/edited" },
    });
    expect(confirm).toBeEnabled();

    fireEvent.click(confirm);
    expect(finishMutate).toHaveBeenCalledTimes(1);
    expect(finishMutate.mock.calls[0][0]).toMatchObject({
      id: "1",
      editedLink: "https://example.com/edited",
      elapsedSeconds: 99,
    });
  });
});
