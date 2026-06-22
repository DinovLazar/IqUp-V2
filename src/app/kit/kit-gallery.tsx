"use client";

import * as React from "react";
import { Star, Sparkles, ArrowRight } from "lucide-react";

import { INDICES, INDEX_ORDER } from "@/lib/indices";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldHelpText } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BandLabel, BAND_ORDER, BANDS } from "@/components/ui/band-label";
import { ConfidenceLabel } from "@/components/ui/confidence-label";
import { IndexBandBar } from "@/components/ui/index-band-bar";
import { Pentagon } from "@/components/ui/pentagon";
import { PuzzleBrain } from "@/components/ui/puzzle-brain";

// ── small layout helpers ──────────────────────────────────────────────────────

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-subhead text-ink">{title}</h2>
        {desc && <p className="text-body text-muted">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-end gap-4">{children}</div>;
}

function Swatch({ name, hex }: { name: string; hex: string }) {
  return (
    <div className="flex w-28 flex-col gap-1">
      <div
        className="h-12 w-full rounded-card border border-border"
        style={{ backgroundColor: hex }}
      />
      <span className="text-label text-ink">{name}</span>
      <span className="text-label font-normal text-muted">{hex}</span>
    </div>
  );
}

function PhotoPlaceholder({
  label = "PLACEHOLDER · Cowork asset",
}: {
  label?: string;
}) {
  return (
    <div className="flex aspect-[4/3] w-full max-w-sm items-center justify-center rounded-card border-2 border-dashed border-border-pur bg-tint-pur/50">
      <span className="text-label font-normal text-muted">{label}</span>
    </div>
  );
}

// ── gallery ───────────────────────────────────────────────────────────────────

export function KitGallery() {
  const [completed, setCompleted] = React.useState(2);
  const [agreed, setAgreed] = React.useState(false);
  const [grad, setGrad] = React.useState<string>();

  const balanced = [62, 58, 66, 54, 60];
  const spiky = [88, 40, 72, 22, 95];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6 pb-24">
      <header className="flex flex-col gap-2">
        <Badge variant="soft">
          <Sparkles aria-hidden /> Dev-only · noindex
        </Badge>
        <h1 className="text-display text-ink">IqUp-V2 — UI kit (1.03)</h1>
        <p className="text-body text-muted">
          Визуелна површина за проверка на сите компоненти и состојби. Не е
          поврзана од продукциската навигација.
        </p>
      </header>

      {/* TYPOGRAPHY */}
      <Section title="Типографија — Montserrat (кирилица + латиница)">
        <p className="text-display text-ink">Display · Когнитивен профил</p>
        <p className="text-subhead text-ink">
          Subhead · Силно просторно мислење
        </p>
        <p className="text-label text-ink">Label · Започни проценка</p>
        <p className="text-body text-ink">
          Body · Лесно замислува и врти облици во умот — предноста зад
          геометријата и инженерството. ABCabc 0123.
        </p>
      </Section>

      {/* COLOR */}
      <Section title="Палета — индекс → боја">
        <Row>
          {INDICES.map((i) => (
            <Swatch key={i.key} name={i.labelShort} hex={i.color} />
          ))}
          <Swatch name="Violet" hex="#762D90" />
          <Swatch name="Grey" hex="#999999" />
        </Row>
      </Section>

      <Section title="Меки тонови + текст-боја (*-ink, ≥4.5:1)">
        <Row>
          {INDICES.map((i) => (
            <Swatch key={i.key} name={`${i.labelShort} soft`} hex={i.soft} />
          ))}
        </Row>
        <Row>
          {INDICES.map((i) => (
            <span key={i.key} className="text-label" style={{ color: i.ink }}>
              {i.labelShort} ink
            </span>
          ))}
        </Row>
      </Section>

      <Section title="Градиенти + површини">
        <Row>
          <div className="h-12 w-44 rounded-card bg-grad-brand" />
          <div className="h-12 w-44 rounded-card border border-border bg-grad-wash" />
          <div className="flex h-12 w-44 items-center justify-center rounded-card border border-border bg-surface text-label text-muted">
            surface
          </div>
          <div className="flex h-12 w-44 items-center justify-center rounded-card border border-border-pur bg-tint-pur text-label text-muted">
            tint-pur
          </div>
        </Row>
      </Section>

      {/* BUTTONS */}
      <Section
        title="Копчиња"
        desc="primary / secondary / ghost — hover, focus (Tab), active и disabled се интерактивни."
      >
        <Row>
          <Button variant="primary">Започни проценка</Button>
          <Button variant="secondary">Назад</Button>
          <Button variant="ghost">Прескокни</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </Row>
        <Row>
          <Button size="lg">
            Закажи демо час <ArrowRight aria-hidden />
          </Button>
          <Button size="icon" aria-label="Следно">
            <ArrowRight aria-hidden />
          </Button>
        </Row>
      </Section>

      {/* CARDS */}
      <Section title="Картички">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Базична површина</CardTitle>
              <CardDescription>
                Бел фон + тенка граница, без сенка.
              </CardDescription>
            </CardHeader>
            <CardContent>Содржина на картичка.</CardContent>
          </Card>
          <Card variant="emphasis">
            <CardHeader>
              <CardTitle>Истакната површина</CardTitle>
              <CardDescription>Виолетов тон + граница.</CardDescription>
            </CardHeader>
            <CardContent>За нагласени делови.</CardContent>
          </Card>
        </div>
      </Section>

      {/* BADGES */}
      <Section title="Беџови (explorer pill)">
        <Row>
          <Badge variant="filled">
            <Star aria-hidden /> IQ UP! Истражувач
          </Badge>
          <Badge variant="soft">
            <Sparkles aria-hidden /> Секција 1 од 5
          </Badge>
        </Row>
      </Section>

      {/* PROGRESS */}
      <Section title="Прогрес (word-labelled)">
        <div className="flex max-w-sm flex-col gap-4">
          <Progress value={20} label="1 од 5 секции" />
          <Progress value={60} label="3 од 5 секции" />
          <Progress value={100} label="5 од 5 секции" />
        </div>
      </Section>

      {/* FORM FIELDS */}
      <Section
        title="Полиња од формулар"
        desc="Без логика на формулар (тоа е 1.08) — само визуелните состојби и error styling."
      >
        <div className="grid max-w-md gap-5">
          <Field>
            <Label htmlFor="name">Име на родител</Label>
            <Input id="name" placeholder="Марија" />
            <FieldHelpText>Само име, без презиме.</FieldHelpText>
          </Field>

          <Field>
            <Label htmlFor="email">Е-пошта (error state)</Label>
            <Input id="email" defaultValue="mar" aria-invalid />
            <FieldError>Внесете валидна е-пошта.</FieldError>
          </Field>

          <Field>
            <Label htmlFor="disabled">Оневозможено поле</Label>
            <Input id="disabled" placeholder="—" disabled />
          </Field>

          <Field>
            <Label htmlFor="city">Град</Label>
            <Select value={grad} onValueChange={setGrad}>
              <SelectTrigger id="city" aria-label="Град">
                <SelectValue placeholder="Изберете град" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skopje">Скопје</SelectItem>
                <SelectItem value="bitola">Битола</SelectItem>
                <SelectItem value="ohrid">Охрид</SelectItem>
                <SelectItem value="tetovo">Тетово</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
              />
              <Label htmlFor="consent" className="leading-snug font-normal">
                Се согласувам со обработката на податоците за да го добијам
                извештајот на е-пошта.
              </Label>
            </div>
            <FieldHelpText>
              Никогаш не е штиклирано однапред (consent: {String(agreed)}).
            </FieldHelpText>
          </Field>

          <div className="flex items-start gap-3">
            <Checkbox id="consent-error" aria-invalid />
            <Label htmlFor="consent-error" className="leading-snug font-normal">
              Консент — error state (за 1.08).
            </Label>
          </div>
        </div>
      </Section>

      {/* BAND LABELS */}
      <Section
        title="Index band-label (збор + индикативен опсег, без број)"
        desc="Значењето го носат зборот + чекор-глифот + бојата заедно — никогаш само бојата."
      >
        <div className="flex flex-col gap-3">
          {BAND_ORDER.map((band) => (
            <BandLabel
              key={band}
              indexKey="logic"
              band={band}
              range={
                BANDS[band].word === "Исклучително"
                  ? "горна третина за возраста"
                  : "за возраста"
              }
            />
          ))}
        </div>
      </Section>

      {/* CONFIDENCE */}
      <Section title="Confidence label">
        <Row>
          <ConfidenceLabel level="high" showLabel />
          <ConfidenceLabel level="medium" showLabel />
          <ConfidenceLabel level="low" showLabel />
        </Row>
      </Section>

      {/* INDEX BAND BARS */}
      <Section title="Index band bar (по индекс)">
        <div className="flex max-w-md flex-col gap-5">
          {INDEX_ORDER.map((key, i) => (
            <IndexBandBar
              key={key}
              indexKey={key}
              band={BAND_ORDER[i % BAND_ORDER.length]}
              range="за возраста"
              confidence={(["high", "medium", "low"] as const)[i % 3]}
            />
          ))}
        </div>
      </Section>

      {/* PENTAGON */}
      <Section title="Пентагон (профил)">
        <Row>
          <div className="flex flex-col items-center gap-2">
            <Pentagon values={balanced} size={260} />
            <span className="text-label font-normal text-muted">balanced</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Pentagon values={spiky} size={260} />
            <span className="text-label font-normal text-muted">spiky</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Pentagon values={spiky} size={120} showLabels={false} />
            <span className="text-label font-normal text-muted">compact</span>
          </div>
        </Row>
      </Section>

      {/* PUZZLE-BRAIN */}
      <Section
        title="Puzzle-brain motif"
        desc="Се склопува со напредокот. Почитува prefers-reduced-motion (моментален snap, без движење)."
      >
        <div className="flex flex-col gap-6">
          <div className="flex max-w-xs flex-col gap-3">
            <PuzzleBrain completed={completed} />
            <label className="text-label text-ink">
              completed: {completed}
              <input
                type="range"
                min={0}
                max={5}
                value={completed}
                onChange={(e) => setCompleted(Number(e.target.value))}
                className="mt-2 w-full accent-pur"
              />
            </label>
          </div>

          <div>
            <p className="mb-2 text-label font-normal text-muted">
              Статички, 0 → 5:
            </p>
            <Row>
              {[0, 1, 2, 3, 4, 5].map((c) => (
                <div key={c} className="flex flex-col items-center gap-1">
                  <PuzzleBrain completed={c} size={84} showTrack={false} />
                  <span className="text-label font-normal text-muted">{c}</span>
                </div>
              ))}
            </Row>
          </div>

          <div>
            <p className="mb-2 text-label font-normal text-muted">
              Chip варијанта (~40px):
            </p>
            <Row>
              {[1, 3, 5].map((c) => (
                <PuzzleBrain key={c} completed={c} variant="chip" />
              ))}
            </Row>
          </div>
        </div>
      </Section>

      {/* PHOTO PLACEHOLDER */}
      <Section
        title="Photo placeholder convention"
        desc="Испрекината рамка таму каде што доаѓа вистинска фотографија (Cowork asset)."
      >
        <PhotoPlaceholder />
      </Section>
    </main>
  );
}
