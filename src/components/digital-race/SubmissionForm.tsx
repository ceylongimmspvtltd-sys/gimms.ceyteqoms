"use client";

import { useActionState } from "react";

import { submitRestaurantAction, type SubmissionState } from "@/app/digital-race/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Public restaurant submission form for the Ceyteq Digital Race.
 * Field names map 1:1 to the columns in
 * supabase/migrations/0002_restaurant_submissions.sql.
 */

const inputClass = "input-inset w-full rounded-2xl px-4 py-3 text-base font-medium";

function Field({
  name,
  label,
  type = "text",
  required = false,
  placeholder,
  autoComplete,
  hint,
  error,
  textarea = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  error?: string;
  textarea?: boolean;
}) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;

  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-bold text-navy">
        {label}
        {required ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1.5 text-xs font-medium text-soft">optional</span>
        )}
      </label>

      {textarea ? (
        <textarea
          id={name}
          name={name}
          rows={4}
          required={required}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputClass} resize-y`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass}
        />
      )}

      {error ? (
        <p id={`${name}-error`} role="alert" className="mt-1.5 text-xs font-semibold text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="mt-1.5 text-xs text-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SubmissionForm() {
  const [state, formAction] = useActionState<SubmissionState | undefined, FormData>(
    submitRestaurantAction,
    undefined,
  );

  if (state?.ok) {
    return (
      <div role="status" className="animate-rise py-4">
        <span className="neu-inset-sm mb-5 grid h-14 w-14 place-items-center rounded-2xl text-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-7 w-7">
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="font-display text-xl font-extrabold text-navy">Entry received</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-body">
          Thank you — your restaurant has been submitted to the Ceyteq Digital
          Race. Our team will review it and reach out using the contact details
          you provided.
        </p>
      </div>
    );
  }

  const err = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state?.error && (
        <p role="alert" className="neu-inset-sm rounded-2xl px-4 py-3 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}

      {/* ── Restaurant ─────────────────────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-blue-brand">
          The restaurant
        </legend>

        <Field
          name="restaurant_name"
          label="Restaurant name"
          required
          placeholder="Lagoon Kitchen"
          error={err.restaurant_name}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="location"
            label="Location"
            placeholder="Negombo Beach Road"
            error={err.location}
          />
          <Field
            name="near_by_city"
            label="Nearest city"
            placeholder="Negombo"
            error={err.near_by_city}
          />
        </div>
        <Field
          name="address"
          label="Full address"
          placeholder="No. 12, Beach Road, Negombo"
          error={err.address}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="phone_number"
            label="Restaurant phone"
            type="tel"
            placeholder="+94 77 000 0000"
            autoComplete="tel"
            error={err.phone_number}
          />
          <Field
            name="whatsapp_number"
            label="Restaurant WhatsApp"
            type="tel"
            placeholder="+94 77 000 0000"
            error={err.whatsapp_number}
          />
        </div>
        <Field
          name="restaurant_email"
          label="Restaurant email"
          type="email"
          placeholder="hello@restaurant.lk"
          autoComplete="email"
          error={err.restaurant_email}
        />
      </fieldset>

      {/* ── Owner ──────────────────────────────────────────────────────── */}
      <fieldset className="space-y-4 border-t border-[#d8d8dc] pt-6">
        <legend className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-blue-brand">
          Owner / contact person
        </legend>

        <Field name="owner_name" label="Owner name" placeholder="Nimal Perera" error={err.owner_name} />
        <Field
          name="owner_email"
          label="Owner email"
          type="email"
          placeholder="owner@restaurant.lk"
          error={err.owner_email}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="owner_phone"
            label="Owner phone"
            type="tel"
            placeholder="+94 77 000 0000"
            error={err.owner_phone}
          />
          <Field
            name="owner_whatsapp"
            label="Owner WhatsApp"
            type="tel"
            placeholder="+94 77 000 0000"
            error={err.owner_whatsapp}
          />
        </div>
      </fieldset>

      {/* ── Brand ──────────────────────────────────────────────────────── */}
      <fieldset className="space-y-4 border-t border-[#d8d8dc] pt-6">
        <legend className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-blue-brand">
          Online presence &amp; brand
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="social_instagram" label="Instagram" placeholder="@restaurant" error={err.social_links} />
          <Field name="social_facebook" label="Facebook" placeholder="facebook.com/restaurant" />
          <Field name="social_tiktok" label="TikTok" placeholder="@restaurant" />
          <Field name="social_website" label="Website" placeholder="https://restaurant.lk" />
        </div>
        <Field name="social_google_maps" label="Google Maps link" placeholder="https://maps.app.goo.gl/…" />

        <div>
          <span className="mb-2 block text-sm font-bold text-navy">Theme colours</span>
          <div className="flex flex-wrap items-center gap-4">
            {["1", "2", "3"].map((i, index) => (
              <label key={i} className="flex items-center gap-2.5">
                <input
                  type="color"
                  name={`theme_color_${i}`}
                  defaultValue={["#10244a", "#4db8e8", "#e4e4e6"][index]}
                  aria-label={`Theme colour ${i}`}
                  className="neu-inset h-11 w-14 cursor-pointer rounded-xl border-0 bg-transparent p-1"
                />
                <span className="text-xs font-semibold text-soft">Colour {i}</span>
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-soft">
            Pick the colours from your logo — we use these for the race profile.
          </p>
        </div>
      </fieldset>

      {/* ── Note ───────────────────────────────────────────────────────── */}
      <fieldset className="space-y-4 border-t border-[#d8d8dc] pt-6">
        <legend className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-blue-brand">
          Anything else
        </legend>
        <Field
          name="special_note"
          label="Special note"
          textarea
          placeholder="Signature dishes, opening hours, or anything we should know."
          error={err.special_note}
        />
      </fieldset>

      {/* Honeypot — real humans never see or fill this. */}
      <div className="hp-field" aria-hidden="true">
        <label>
          Company website
          <input name="company-website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <SubmitButton pendingLabel="Submitting entry…">
        Submit entry
        <ArrowRightIcon className="h-5 w-5" />
      </SubmitButton>

      <p className="text-center text-xs leading-relaxed text-soft">
        Your details are used only to review this entry and contact you about
        the Digital Race. We never publish your contact information.
      </p>
    </form>
  );
}
