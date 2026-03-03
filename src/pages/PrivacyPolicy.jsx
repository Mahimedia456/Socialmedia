import React from "react";
import AppShell from "../components/AppShell.jsx";

export default function PrivacyPolicy({ theme, setTheme }) {
  const COMPANY = "Mahimedia Solutions";
  const APP = "Mahimedia Social Media Management App";
  const EFFECTIVE_DATE = "March 3, 2026";

  return (
    <AppShell theme={theme} setTheme={setTheme} active="">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
        <p className="text-white/50 mt-2">Effective date: {EFFECTIVE_DATE}</p>

        <div className="mt-8 space-y-8 text-white/80 leading-relaxed">
          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">1. Who We Are</h2>
            <p className="mt-3">
              This Privacy Policy explains how <b>{COMPANY}</b> (“we”, “us”, “our”) collects, uses, and
              protects information when you use <b>{APP}</b> (the “Service”).
            </p>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">2. Information We Collect</h2>
            <ul className="mt-3 list-disc ml-6 space-y-2">
              <li>
                <b>Account data:</b> email, role, workspace membership, and authentication tokens needed
                to run the Service.
              </li>
              <li>
                <b>Connected channel data (Meta):</b> page IDs, Instagram business account IDs, page
                access tokens (stored securely), and configuration metadata for connected channels.
              </li>
              <li>
                <b>Inbox data:</b> message content and conversation identifiers synchronized from
                connected channels to provide an inbox experience.
              </li>
              <li>
                <b>Usage data:</b> logs like API request timestamps, error logs, and security events to
                maintain reliability and prevent abuse.
              </li>
            </ul>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">3. How We Use Information</h2>
            <ul className="mt-3 list-disc ml-6 space-y-2">
              <li>To authenticate users and operate workspaces.</li>
              <li>To connect and sync supported channels (Facebook/Instagram) you authorize.</li>
              <li>To display and send messages through the Service at your request.</li>
              <li>To improve stability, diagnose issues, and protect the platform from abuse.</li>
            </ul>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">4. Legal Basis</h2>
            <p className="mt-3">
              We process information to provide the Service (contract necessity), to comply with legal
              obligations, and for legitimate interests like security and system integrity. Where
              required, we rely on your consent (for example, when you connect a Meta account).
            </p>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">5. Meta / Third-Party Services</h2>
            <p className="mt-3">
              If you connect Facebook Pages or Instagram accounts, we access and process data provided
              by Meta APIs based on the permissions you grant. Your use of those platforms is also
              governed by Meta’s policies. We only use channel data to provide features you enable in
              the Service.
            </p>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">6. Data Retention</h2>
            <p className="mt-3">
              We retain data as long as needed to provide the Service, comply with legal requirements,
              and resolve disputes. You can request deletion of workspace data, subject to operational
              and legal constraints.
            </p>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">7. Security</h2>
            <p className="mt-3">
              We implement reasonable technical and organizational safeguards. No system is 100%
              secure, but we work to protect your data using access controls, encryption-in-transit,
              and least-privilege design.
            </p>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">8. Your Rights</h2>
            <ul className="mt-3 list-disc ml-6 space-y-2">
              <li>Request access, correction, or deletion of your data.</li>
              <li>Withdraw consent for channel connections by disconnecting channels.</li>
              <li>Request export of certain data, where applicable.</li>
            </ul>
          </section>

          <section className="glass-panel rounded-2xl border-glass-border p-6">
            <h2 className="text-xl font-bold text-white">9. Contact</h2>
            <p className="mt-3">
              If you have questions, contact <b>{COMPANY}</b> support.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}