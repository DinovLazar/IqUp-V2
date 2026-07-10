"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { Controller, useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";

import type { AssessmentResult } from "@/features/scoring";
import {
  leadSchema,
  runLeadSubmit,
  submitLead,
  writeScore,
  type LeadFormValues,
  type LeadLocale,
} from "@/features/lead";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHelpText } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Lead form (Phase 1.08) — a phase inside the /procena flow, NOT a route. One
// short form: parent first name (no surname, no child name — GDPR), email, phone,
// city, optional child gender, and three SEPARATE, never-pre-ticked consents.
// Validation is the shared `leadSchema` via the Zod resolver; required-consent
// failures surface inline (FieldError), not a silent disabled button. On a valid
// submit it calls the stubbed `submitLead`, fires `lead_submit`, and hands the
// values forward to the confirmation. Nothing leaves the browser in Part 1.
//
// Field ids are namespaced by a `useId()` prefix so multiple instances on one
// page (the /kit gallery) never collide on label/error associations.

const EMPTY_DEFAULTS: LeadFormValues = {
  parentFirstName: "",
  email: "",
  phone: "",
  city: "",
  childGender: undefined,
  consentService: false,
  consentParent: false,
  consentMarketing: false,
};

export interface LeadFormProps {
  /** The scored session — handed to `submitLead` + the separate anonymous score write. */
  result: AssessmentResult;
  /** Valid submit → carry the values to the confirmation. */
  onSubmitted: (values: LeadFormValues) => void;
  /** Preview/test seam: seed field values. */
  defaultValues?: Partial<LeadFormValues>;
  /** Preview/test seam: validate on mount so the error states are visible in /kit. */
  autoValidate?: boolean;
}

export function LeadForm({
  result,
  onSubmitted,
  defaultValues,
  autoValidate,
}: LeadFormProps) {
  const t = useTranslations("leadForm");
  const tl = useTranslations("legal");
  const locale = useLocale() as LeadLocale;
  const uid = React.useId();
  const fid = (name: string) => `${uid}-${name}`;
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
    mode: "onTouched",
  });

  // Appendix F: the form was viewed. Fire once on mount (no PII).
  React.useEffect(() => {
    trackEvent("form_view");
    if (autoValidate) void trigger();
  }, [autoValidate, trigger]);

  const onValid = async (values: LeadFormValues) => {
    setSubmitError(null);
    try {
      await runLeadSubmit(values, result, locale, {
        submit: submitLead,
        writeScore,
        track: trackEvent,
        onSubmitted,
      });
    } catch {
      // Part 1: `submitLead` never rejects. This guard keeps the button
      // recoverable (RHF resets `isSubmitting`) and shows feedback once Part 2
      // wires the real Brevo/CAPI/PDF call, which can fail.
      setSubmitError(t("errors.submitFailed"));
    }
  };

  /** Map a field's error TOKEN to its localized message. */
  const errText = (token?: string) =>
    token ? t(`errors.${token}`) : undefined;

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 py-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-ink">{t("title")}</h1>
        <p className="text-body text-muted">{t("intro")}</p>
      </div>

      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={handleSubmit(onValid)}
      >
        {/* Parent first name — first name only, no surname (GDPR). */}
        <Field>
          <Label htmlFor={fid("parentFirstName")}>{t("firstNameLabel")}</Label>
          <Input
            id={fid("parentFirstName")}
            autoComplete="given-name"
            placeholder={t("firstNamePlaceholder")}
            aria-invalid={errors.parentFirstName ? true : undefined}
            aria-describedby={
              errors.parentFirstName
                ? fid("parentFirstName-error")
                : fid("parentFirstName-help")
            }
            {...register("parentFirstName")}
          />
          {errors.parentFirstName ? (
            <FieldError id={fid("parentFirstName-error")}>
              {errText(errors.parentFirstName.message)}
            </FieldError>
          ) : (
            <FieldHelpText id={fid("parentFirstName-help")}>
              {t("firstNameHelp")}
            </FieldHelpText>
          )}
        </Field>

        {/* Email */}
        <Field>
          <Label htmlFor={fid("email")}>{t("emailLabel")}</Label>
          <Input
            id={fid("email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? fid("email-error") : undefined}
            {...register("email")}
          />
          {errors.email && (
            <FieldError id={fid("email-error")}>
              {errText(errors.email.message)}
            </FieldError>
          )}
        </Field>

        {/* Phone — permissive (international formats welcome). */}
        <Field>
          <Label htmlFor={fid("phone")}>{t("phoneLabel")}</Label>
          <Input
            id={fid("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t("phonePlaceholder")}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? fid("phone-error") : undefined}
            {...register("phone")}
          />
          {errors.phone && (
            <FieldError id={fid("phone-error")}>
              {errText(errors.phone.message)}
            </FieldError>
          )}
        </Field>

        {/* City — free-text now; swap-to-<select> seam lives in CityField. */}
        <CityField
          control={control}
          id={fid("city")}
          label={t("cityLabel")}
          placeholder={t("cityPlaceholder")}
          help={t("cityHelp")}
          error={errText(errors.city?.message)}
        />

        {/* Child gender — optional. */}
        <Field>
          <Label htmlFor={fid("childGender")}>
            {t("genderLabel")}{" "}
            <span className="font-normal text-muted">
              ({t("genderOptional")})
            </span>
          </Label>
          <Controller
            control={control}
            name="childGender"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={fid("childGender")}
                  aria-label={t("genderLabel")}
                >
                  <SelectValue placeholder={t("genderPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("genderMale")}</SelectItem>
                  <SelectItem value="female">{t("genderFemale")}</SelectItem>
                  <SelectItem value="undisclosed">
                    {t("genderUndisclosed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {/* §D.2 data note — what we store and what the contact is for. */}
        <p className="rounded-field border border-border bg-bg p-3 text-label font-normal text-muted">
          {tl("dataNote")}
        </p>

        {/* Three separate consents — none pre-ticked. */}
        <div className="flex flex-col gap-4">
          <ConsentField
            control={control}
            name="consentService"
            id={fid("consentService")}
            error={errText(errors.consentService?.message)}
          >
            {t.rich("consentService", {
              link: (chunks) => (
                <Link
                  href="/politika-za-privatnost"
                  className="text-pur underline underline-offset-2"
                  // The link sits inside the consent <label>; stop the click from
                  // bubbling so following it never toggles the consent checkbox.
                  onClick={(e) => e.stopPropagation()}
                >
                  {chunks}
                </Link>
              ),
            })}
          </ConsentField>

          <ConsentField
            control={control}
            name="consentParent"
            id={fid("consentParent")}
            error={errText(errors.consentParent?.message)}
          >
            {t("consentParent")}
          </ConsentField>

          <ConsentField
            control={control}
            name="consentMarketing"
            id={fid("consentMarketing")}
          >
            {t("consentMarketing")}
          </ConsentField>
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
        {submitError && (
          <FieldError id={fid("submit-error")}>{submitError}</FieldError>
        )}
      </form>
    </div>
  );
}

/**
 * City field. **Swap seam (Decision 3):** in Part 2 the inner `Input` becomes a
 * `<Select>` of real centers-by-city — only this component changes; the schema
 * (a non-empty string) and the call site stay put.
 */
function CityField({
  control,
  id,
  label,
  placeholder,
  help,
  error,
}: {
  control: Control<LeadFormValues>;
  id: string;
  label: string;
  placeholder: string;
  help: string;
  error?: string;
}) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <Controller
        control={control}
        name="city"
        render={({ field }) => (
          <Input
            id={id}
            autoComplete="address-level2"
            placeholder={placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : helpId}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
          />
        )}
      />
      {error ? (
        <FieldError id={errorId}>{error}</FieldError>
      ) : (
        <FieldHelpText id={helpId}>{help}</FieldHelpText>
      )}
    </Field>
  );
}

/** One consent row: a never-pre-ticked checkbox + its (rich) label + inline error. */
function ConsentField({
  control,
  name,
  id,
  error,
  children,
}: {
  control: Control<LeadFormValues>;
  name: "consentService" | "consentParent" | "consentMarketing";
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <Field className="gap-2">
      <div className="flex items-start gap-3">
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Checkbox
              id={id}
              className="mt-0.5"
              checked={field.value === true}
              onCheckedChange={(v) => field.onChange(v === true)}
              onBlur={field.onBlur}
              ref={field.ref}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
            />
          )}
        />
        <Label htmlFor={id} className="leading-snug font-normal">
          {children}
        </Label>
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  );
}
