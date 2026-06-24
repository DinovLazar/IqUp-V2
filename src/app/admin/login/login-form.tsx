"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { createAdminBrowserClient } from "@/lib/supabase/admin-browser";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHelpText } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Admin login state machine (Phase 2.04). NOT the security boundary — it only
// drives the session to assurance level aal2 (which `requireAdmin()` then
// requires). Steps:
//   1. "signin"   — email + password (signInWithPassword).
//   2. after sign-in, branch on MFA state:
//        - already aal2            → straight to /admin
//        - a verified TOTP factor  → "challenge" (enter code)
//        - no factor               → "enroll" (show QR/secret, enter code)
//   3. challenge/verify the factor → aal2 → /admin.
// Errors surface as friendly MK lines; the panel pages re-check server-side.

type Step = "signin" | "enroll" | "challenge";

interface EnrollData {
  factorId: string;
  qr: string;
  secret: string;
}

export function LoginForm() {
  const t = useTranslations("admin.login");
  const router = useRouter();
  const supabase = React.useMemo(() => createAdminBrowserClient(), []);

  const [step, setStep] = React.useState<Step>("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [enroll, setEnroll] = React.useState<EnrollData | null>(null);
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function done() {
    router.replace("/admin");
    router.refresh();
  }

  /** After a valid password, decide whether to challenge an existing factor or enrol. */
  async function routeAfterPassword() {
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal2") {
      done();
      return;
    }

    const { data: factors, error: listErr } =
      await supabase.auth.mfa.listFactors();
    if (listErr) {
      setError(t("errors.generic"));
      return;
    }

    const verified = factors?.totp?.find((f) => f.status === "verified");
    if (verified) {
      setFactorId(verified.id);
      setStep("challenge");
      return;
    }

    // Clear any stale UNVERIFIED factor first (e.g. a prior enrol abandoned
    // before entering a code) so abandoned attempts can't accumulate toward the
    // per-user factor cap and brick enrolment. (`factors.totp` is verified-only,
    // so unverified factors live only in `factors.all`.)
    const stale = factors?.all?.find(
      (f) => f.factor_type === "totp" && f.status === "unverified",
    );
    if (stale) {
      await supabase.auth.mfa.unenroll({ factorId: stale.id });
    }

    // No verified TOTP factor → enrol a fresh one.
    const { data: enrolled, error: enrollErr } = await supabase.auth.mfa.enroll(
      { factorType: "totp" },
    );
    if (enrollErr || !enrolled) {
      setError(t("errors.enrollFailed"));
      return;
    }
    setEnroll({
      factorId: enrolled.id,
      qr: enrolled.totp.qr_code,
      secret: enrolled.totp.secret,
    });
    setFactorId(enrolled.id);
    setStep("enroll");
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) {
        setError(t("errors.invalidCredentials"));
        return;
      }
      await routeAfterPassword();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setBusy(true);
    try {
      const { data: challenge, error: challengeErr } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr || !challenge) {
        setError(t("errors.generic"));
        return;
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyErr) {
        setError(t("errors.invalidCode"));
        return;
      }
      done();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-card border border-border bg-surface p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-subhead text-ink">{t("title")}</h1>
        <p className="text-body text-muted">
          {step === "signin" ? t("intro") : t("mfaTitle")}
        </p>
      </div>

      {step === "signin" && (
        <form noValidate className="flex flex-col gap-4" onSubmit={onSignIn}>
          <Field>
            <Label htmlFor="admin-email">{t("emailLabel")}</Label>
            <Input
              id="admin-email"
              type="email"
              inputMode="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="admin-password">{t("passwordLabel")}</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && <FieldError>{error}</FieldError>}
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? t("signingIn") : t("signIn")}
          </Button>
        </form>
      )}

      {(step === "enroll" || step === "challenge") && (
        <form noValidate className="flex flex-col gap-4" onSubmit={onVerify}>
          <p className="text-body text-muted">
            {step === "enroll" ? t("mfaEnrollIntro") : t("mfaChallengeIntro")}
          </p>

          {step === "enroll" && enroll && (
            <div className="flex flex-col items-center gap-3">
              {/* QR is a Supabase-generated SVG data URI. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enroll.qr}
                alt={t("qrAlt")}
                width={180}
                height={180}
                className="rounded-field border border-border bg-white p-2"
              />
              <div className="w-full text-center">
                <p className="text-label text-muted">{t("mfaSecretLabel")}</p>
                <code className="mt-1 block rounded-field bg-bg px-3 py-2 text-label break-all text-ink">
                  {enroll.secret}
                </code>
              </div>
            </div>
          )}

          <Field>
            <Label htmlFor="admin-code">{t("codeLabel")}</Label>
            <Input
              id="admin-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              placeholder={t("codePlaceholder")}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
            />
            <FieldHelpText>{t("codePlaceholder")}</FieldHelpText>
          </Field>

          {error && <FieldError>{error}</FieldError>}
          <Button type="submit" size="lg" disabled={busy || code.length < 6}>
            {busy ? t("verifying") : t("verify")}
          </Button>
        </form>
      )}
    </div>
  );
}
