"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";

import { AGE_MAX, AGE_MIN } from "@/content/norms";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHelpText } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Setup — the only thing we ask is the child's age (5–13), so the battery can be
// sized. NO child name is ever collected (GDPR). Ages outside 5–13 are blocked
// with a clear Macedonian message.
export function SetupScreen({ onSubmit }: { onSubmit: (age: number) => void }) {
  const t = useTranslations("setup");
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = () => {
    const n = Number(value);
    if (!value.trim() || !Number.isFinite(n)) {
      setError(t("ageErrorEmpty"));
      return;
    }
    if (n < AGE_MIN || n > AGE_MAX) {
      setError(t("ageErrorRange"));
      return;
    }
    setError(null);
    onSubmit(Math.round(n));
  };

  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-ink">{t("title")}</h1>
        <p className="text-body text-muted">{t("intro")}</p>
      </div>

      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field>
          <Label htmlFor="age">{t("ageLabel")}</Label>
          <div className="flex items-center gap-3">
            <Input
              id="age"
              type="number"
              inputMode="numeric"
              min={AGE_MIN}
              max={AGE_MAX}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("agePlaceholder")}
              aria-invalid={error ? true : undefined}
              className="max-w-32"
            />
            <span className="text-body text-muted">{t("ageUnit")}</span>
          </div>
          {error ? (
            <FieldError>{error}</FieldError>
          ) : (
            <FieldHelpText>{t("ageHelp")}</FieldHelpText>
          )}
        </Field>

        <p className="flex items-start gap-2 text-label font-normal text-muted">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t("noNameNote")}
        </p>

        <Button type="submit" size="lg" className="self-start">
          {t("continue")}
        </Button>
      </form>
    </div>
  );
}
