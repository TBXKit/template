import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const { loginAction } = vi.hoisted(() => ({
  loginAction: vi.fn(),
}));

vi.mock("@/app/login/login-action", () => ({
  loginAction,
}));

describe("LoginForm", () => {
  it("renders a username input and a hidden field carrying the return path", () => {
    render(<LoginForm next="/package/123" />);

    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    const hidden = document.querySelector('input[name="next"]');
    expect(hidden).toHaveValue("/package/123");
  });

  it("submits the entered username and the next path", async () => {
    loginAction.mockResolvedValueOnce(null);
    render(<LoginForm next="/cart" />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "Notch" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(loginAction).toHaveBeenCalled();
    });
    const formData = loginAction.mock.calls[0][1] as FormData;
    expect(formData.get("username")).toBe("Notch");
    expect(formData.get("next")).toBe("/cart");
  });

  it("shows a specific error message when the action rejects the submission", async () => {
    loginAction.mockResolvedValueOnce({
      success: false,
      error: "Please enter a username.",
    });
    render(<LoginForm next="/" />);

    // A single space passes the input's native `required` check (non-empty)
    // but still fails login-action.ts's own trimmed check — exercising the
    // server-side validation path a real click on an empty field never
    // reaches (native `required` blocks that submission entirely).
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: " " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Please enter a username."),
    ).toBeInTheDocument();
  });

  it("shows no error message before any submission", () => {
    render(<LoginForm next="/" />);

    expect(screen.queryByText(/please enter/i)).not.toBeInTheDocument();
  });
});
