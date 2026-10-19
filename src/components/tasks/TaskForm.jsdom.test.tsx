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

  it("accepts one submit while a save is pending and lets the user retry a failed save", async () => {
    let rejectSave!: (error: Error) => void;
    const onSubmit = vi.fn(() => new Promise<void>((_, reject) => {
      rejectSave = reject;
    }));
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

    fireEvent.change(screen.getByPlaceholderText("What needs to happen?"), {
      target: { value: "One task only" },
    });
    const save = screen.getByRole("button", { name: "Save task" });
    fireEvent.click(save);
    fireEvent.click(save);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Saving…" }).hasAttribute("disabled")).toBe(true);

    rejectSave(new Error("Storage unavailable"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Could not save task"));

    fireEvent.click(screen.getByRole("button", { name: "Save task" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
  });

  it("applies a template only once while its write is pending", async () => {
    let finishSave!: () => void;
    const onUseTemplate = vi.fn(() => new Promise<void>((resolve) => {
      finishSave = resolve;
    }));
    render(
      <TaskForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        onUseTemplate={onUseTemplate}
        templates={[{
          id: "template-1", name: "Review", icon: "📋", builtIn: false,
          order: 0, createdAt: 0,
          items: [{ title: "Check", category: "Work", priority: "medium", color: "burgundy" }],
        }]}
        dateLabel="today"
        targetDate={new Date(2026, 9, 18)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    const template = screen.getByRole("button", { name: /Review/ });
    fireEvent.click(template);
    fireEvent.click(template);

    await waitFor(() => expect(onUseTemplate).toHaveBeenCalledTimes(1));
    expect(template.hasAttribute("disabled")).toBe(true);
    finishSave();
  });
});
