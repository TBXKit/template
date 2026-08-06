"use client";

import { useActionState } from "react";
import type { Basket } from "@/lib/tebex/types";
import {
  applyCouponAction,
  applyCreatorCodeAction,
  applyGiftCardAction,
  type PromoCodeResult,
  removeCouponAction,
  removeCreatorCodeAction,
  removeGiftCardAction,
} from "./promo-code-actions";

/**
 * Coupon / gift card / creator code sections for `/cart`. A Client Component
 * because applying/removing a code needs pending/error state from
 * `useActionState` (per AGENTS.md's Client Component convention) — the
 * three sections share the same "enter a code, apply it, see it listed,
 * remove it" shape, so they're built from two private, non-exported pieces
 * (`CodeApplyForm`, `RemoveCodeButton`) rather than three near-duplicate
 * sections.
 */
export function PromoCodes({ basket }: { basket: Basket }) {
  return (
    <div className="mt-6 space-y-6 border-t border-border pt-6">
      <section>
        <h3 className="text-sm font-medium text-foreground">Coupon code</h3>
        {basket.coupons.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {basket.coupons.map((coupon) => (
              <AppliedCode
                key={coupon.code}
                label={coupon.code}
                onRemove={() => removeCouponAction(coupon.code)}
              />
            ))}
          </ul>
        ) : null}
        <CodeApplyForm
          fieldName="coupon-code"
          label="Coupon code"
          placeholder="Enter coupon code"
          apply={applyCouponAction}
        />
      </section>

      <section>
        <h3 className="text-sm font-medium text-foreground">Gift card</h3>
        {basket.giftcards.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {basket.giftcards.map((giftcard) => (
              <AppliedCode
                key={giftcard.card_number}
                label={giftcard.card_number}
                onRemove={() => removeGiftCardAction(giftcard.card_number)}
              />
            ))}
          </ul>
        ) : null}
        <CodeApplyForm
          fieldName="gift-card-number"
          label="Gift card number"
          placeholder="Enter gift card number"
          apply={applyGiftCardAction}
        />
      </section>

      <section>
        <h3 className="text-sm font-medium text-foreground">Creator code</h3>
        {basket.creator_code ? (
          <ul className="mt-2 space-y-1">
            <AppliedCode
              label={basket.creator_code}
              onRemove={() => removeCreatorCodeAction()}
            />
          </ul>
        ) : (
          // Applying a new creator code replaces the current one rather
          // than adding to it — a basket only ever has one active at a
          // time (`Basket.creator_code` is a single nullable string, not a
          // list) — so the form is only shown when none is set.
          <CodeApplyForm
            fieldName="creator-code"
            label="Creator code"
            placeholder="Enter creator code"
            apply={applyCreatorCodeAction}
          />
        )}
      </section>
    </div>
  );
}

function CodeApplyForm({
  fieldName,
  label,
  placeholder,
  apply,
}: {
  fieldName: string;
  label: string;
  placeholder: string;
  apply: (code: string) => Promise<PromoCodeResult>;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_: PromoCodeResult | null, formData: FormData) =>
      apply(String(formData.get(fieldName) ?? "")),
    null,
  );

  return (
    <div>
      <form action={formAction} className="mt-2 flex gap-2">
        <input
          type="text"
          name={fieldName}
          required
          placeholder={placeholder}
          aria-label={label}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary disabled:opacity-60"
        >
          {isPending ? "Applying…" : "Apply"}
        </button>
      </form>
      {state && !state.success ? (
        <p aria-live="polite" className="mt-1 text-sm text-muted-foreground">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

// One applied coupon/gift-card/creator-code row — not exported, since it
// only ever appears as part of the sections above.
function AppliedCode({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => Promise<PromoCodeResult>;
}) {
  const [state, formAction, isPending] = useActionState(
    async () => onRemove(),
    null,
  );

  return (
    <li className="text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-card-foreground">{label}</span>
        <form action={formAction}>
          <button
            type="submit"
            disabled={isPending}
            className="text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline disabled:opacity-60"
          >
            {isPending ? "Removing…" : "Remove"}
          </button>
        </form>
      </div>
      {state && !state.success ? (
        <p aria-live="polite" className="mt-1 text-muted-foreground">
          {state.error}
        </p>
      ) : null}
    </li>
  );
}
