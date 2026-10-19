// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskForm } from "./TaskForm";

afterEach(() => cleanup());

describe("TaskForm quick add", () => {
  it("saves a title with defaults before optional fields are opened", async () => {
    const onSubmit = vi.fn();
    render(
      <TaskForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        onUseTemplate={vi.fn()}
        templates={[]}
        dateLabel="today"
        targetDate={new Date(2026, 9, 18)}
      />,
    );

    expect(screen.queryByText("Estimated time")).toBeNull();
    fireEvent.change(screen.getByPlaceholderText("What needs to happen?"), {
      target: { value: "Review sprint plan" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save task" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Review sprint plan",
          priority: "medium",
          recurrence: "none",
        }),
      ),
    );
  });

  it("reveals optional planning fields on request", () => {
    render(
      <TaskForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        onUseTemplate={vi.fn()}
        templates={[]}
        dateLabel="today"
        targetDate={new Date(2026, 9, 18)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "More options" }));
    expect(screen.getByText("Estimated time")).toBeTruthy();
    expect(screen.getByText("Repeat")).toBeTruthy();
  });
});
