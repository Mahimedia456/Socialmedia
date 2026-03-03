import React from "react";
import AppShell from "../components/AppShell.jsx";

export default function TermsConditions({ theme, setTheme }) {
  const COMPANY = "Mahimedia Solutions";
  const APP = "Mahimedia Social Media Management App";
  const EFFECTIVE_DATE = "March 3, 2026";

  return (
    <AppShell theme={theme} setTheme={setTheme} active="">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-black text-white">Terms & Conditions</h1>
        <p className="text-white/50 mt-2">Effective date: {EFFECTIVE_DATE}</p>

        <div className="mt-8 space-y-8 text-white/80 leading-relaxed">
          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">1. Agreement</h2>
            <p className="mt-3">
              By using <b>{APP}</b> (the “Service”), you agree to these Terms. If you do not agree, do
              not use the Service.
            </p>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">2. Accounts & Access</h2>
            <ul className="mt-3 list-disc ml-6 space-y-2">
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>You must use the Service only for lawful business purposes.</li>
              <li>Workspace admins are responsible for member access and permissions.</li>
            </ul>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">3. Connected Channels (Meta)</h2>
            <p className="mt-3">
              You may connect Facebook Pages and Instagram professional accounts if you have the right
              to manage them. You authorize the Service to access data from connected channels only to
              provide features you enable (syncing conversations, sending replies, etc.).
            </p>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">4. Acceptable Use</h2>
            <ul className="mt-3 list-disc ml-6 space-y-2">
              <li>No abuse, harassment, spamming, or illegal content.</li>
              <li>No attempts to bypass security, scrape, or reverse engineer the Service.</li>
              <li>No use that violates third-party platform rules (including Meta policies).</li>
            </ul>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">5. Availability</h2>
            <p className="mt-3">
              The Service is provided “as is” and may change over time. We may suspend access for
              maintenance, security incidents, or policy violations.
            </p>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">6. Disclaimers</h2>
            <p className="mt-3">
              We do not guarantee that third-party platforms (e.g., Meta) will always provide data or
              allow specific messaging features. Feature availability depends on platform permissions,
              approvals, and account configuration.
            </p>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">7. Limitation of Liability</h2>
            <p className="mt-3">
              To the maximum extent allowed by law, <b>{COMPANY}</b> will not be liable for indirect,
              incidental, special, or consequential damages, or loss of data, revenue, or profits.
            </p>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">8. Termination</h2>
            <p className="mt-3">
              We may suspend or terminate access if you violate these Terms or if required for
              security/legal reasons. You may stop using the Service at any time.
            </p>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">9. Contact</h2>
            <p className="mt-3">
              Questions about these Terms? Contact <b>{COMPANY}</b> support.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}