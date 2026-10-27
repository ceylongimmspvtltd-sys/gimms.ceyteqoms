import type { Metadata } from "next";

import { Logo } from "@/components/brand/Logo";
import { ContactFooter } from "@/components/ContactFooter";
import { SubmissionForm } from "@/components/digital-race/SubmissionForm";
import { ShieldIcon, UserIcon, WebsitesIcon } from "@/components/icons";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Digital Race — Restaurant Submission",
  description:
    "Submit your restaurant to the Ceyteq Digital Race. Tell us about your venue, your team and your brand.",
};

/**
 * Public landing page + submission form. No authentication required — the
 * middleware only gates /dashboard/*, and the insert goes through the anon
 * Supabase client so the table's RLS policy remains the final authority.
 */
export default function DigitalRacePage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <main className="grid flex-1 items-start gap-6 py-6 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
        {/* Branding panel */}
        <section className="neu-dark animate-rise rounded-card-lg p-7 sm:p-9 lg:sticky lg:top-6 lg:p-11">
          <Logo variant="full" priority className="mx-auto w-full max-w-sm lg:mx-0" />
          <p className="mt-5 text-center font-display text-lg font-bold tracking-wide text-radium-light lg:text-left">
            {siteConfig.tagline}
          </p>

          <h1 className="mt-7 text-center font-display text-3xl font-extrabold leading-tight tracking-tight text-white lg:text-left lg:text-[34px]">
            Ceyteq Digital Race
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-[#b9cde4] lg:text-left">
            Put your restaurant on the map. Submit your details and our team will
            review your entry for the Digital Race — a free digital presence
            build-out for selected venues.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              {
                icon: <WebsitesIcon className="h-5 w-5" />,
                title: "Free digital profile",
                text: "Your menu, location and brand colours, built for you.",
              },
              {
                icon: <ShieldIcon className="h-5 w-5" />,
                title: "Private by default",
                text: "Your contact details are never published or sold.",
              },
              {
                icon: <UserIcon className="h-5 w-5" />,
                title: "Reviewed by people",
                text: "A real Ceyteq team member reviews every entry.",
              },
            ].map((f) => (
              <li key={f.title} className="flex items-start gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/5 text-radium shadow-[inset_0_1px_0_rgba(143,219,247,0.35),0_0_16px_rgba(77,184,232,0.25)]">
                  {f.icon}
                </span>
                <span>
                  <span className="block font-display text-sm font-bold text-white">
                    {f.title}
                  </span>
                  <span className="block text-sm text-[#b9cde4]">{f.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Form card */}
        <section className="neu-raised-lg animate-rise rounded-card-lg p-6 sm:p-9 lg:p-10">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy sm:text-[28px]">
            Submit your restaurant
          </h2>
          <p className="mb-7 mt-1.5 text-sm text-body">
            Takes about two minutes. Fields marked{" "}
            <span className="font-bold text-danger">*</span> are required.
          </p>
          <SubmissionForm />
        </section>
      </main>

      <footer className="pb-2 pt-4">
        <ContactFooter />
      </footer>
    </div>
  );
}
