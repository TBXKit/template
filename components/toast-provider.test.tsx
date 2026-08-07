import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "./toast-provider";

function ShowToastButton({
  message,
  tone,
}: {
  message: string;
  tone: "success" | "error";
}) {
  const showToast = useToast();
  return (
    <button type="button" onClick={() => showToast(message, tone)}>
      Trigger
    </button>
  );
}

describe("ToastProvider — outside a provider", () => {
  it("useToast falls back to a no-op instead of throwing", () => {
    // No <ToastProvider> wrapper — mirrors how components using this hook
    // are rendered standalone in their own tests.
    render(<ShowToastButton message="Added to your basket." tone="success" />);

    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: "Trigger" })),
    ).not.toThrow();
  });
});

describe("ToastProvider — showing a toast", () => {
  it("renders the message when shown", () => {
    render(
      <ToastProvider>
        <ShowToastButton message="Added to your basket." tone="success" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Trigger" }));

    expect(screen.getByText("Added to your basket.")).toBeInTheDocument();
  });

  it("replaces rather than stacks when a second toast is shown", () => {
    render(
      <ToastProvider>
        <ShowToastButton message="First message" tone="success" />
        <ShowToastButton message="Second message" tone="error" />
      </ToastProvider>,
    );

    const [first, second] = screen.getAllByRole("button", { name: "Trigger" });
    fireEvent.click(first);
    fireEvent.click(second);

    expect(screen.queryByText("First message")).not.toBeInTheDocument();
    expect(screen.getByText("Second message")).toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("dismisses when the dismiss button is clicked", () => {
    render(
      <ToastProvider>
        <ShowToastButton message="Added to your basket." tone="success" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByText("Added to your basket.")).not.toBeInTheDocument();
  });

  it("uses an assertive live region for an error toast", () => {
    render(
      <ToastProvider>
        <ShowToastButton message="Something went wrong." tone="error" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Trigger" }));

    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-live",
      "assertive",
    );
  });
});

describe("ToastProvider — auto-dismiss", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dismisses on its own after the timeout elapses", () => {
    render(
      <ToastProvider>
        <ShowToastButton message="Added to your basket." tone="success" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
    expect(screen.getByText("Added to your basket.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText("Added to your basket.")).not.toBeInTheDocument();
  });
});
