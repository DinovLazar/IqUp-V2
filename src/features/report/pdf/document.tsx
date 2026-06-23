/**
 * The branded PDF document builder (Phase 1.09).
 *
 * `buildReportDocument(model)` is a PURE function of the `ReportModel` (the single
 * render contract from 1.07) plus a pre-built booking href: same model + same href
 * → deep-equal `<Document>` element tree. No clock, no randomness, no env, no IO —
 * the impure seams (font registration, booking-URL/env resolution, render-to-buffer)
 * live in `fonts.ts` / `render.ts`. This mirrors the on-screen confirmation
 * (`procena/confirmation.tsx`) but renders the FULL report (spec Дел 10.3): the
 * branded puzzle-brain header, Part А (pentagon + five word/range bands + per-index
 * confidence + top strength + growth area + solving style + home activities), Part Б
 * (STEM readiness + bridge), the IQ UP! positioning, the booking CTA, and the §16.1
 * disclaimer — the FULL §D.4 paragraph at the top and the SHORT line as a fixed
 * footer on every page. Both restate the same `messages/mk.json` `legal` keys the
 * shared DOM `Disclaimer` component reads (Phase 1.10); a copy-parity guard test
 * (`pdf/__tests__/disclaimer-parity`) keeps the two renderers tied to that one
 * source.
 *
 * No hard number is ever drawn as text — only the band WORD + indicative range
 * (spec Дел 10.2). The numeric index value reaches the page only as pentagon
 * geometry. Internal metadata (engine / scoring / norms versions, the program
 * mapping `programHook`) is NEVER printed — two-register rule.
 *
 * The strong-validity branch (`variant: "retry"`) renders the graceful-retry
 * message with NO confident profile and NO pentagon (spec Дел 7.1), mirroring the
 * confirmation's retry view.
 */

import * as React from "react";
import {
  ClipPath,
  Defs,
  Document,
  Ellipse,
  G,
  Line,
  Link,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";

import { INDEX_BY_KEY, INDICES } from "@/lib/indices";
import { BOOKING_URL_PLACEHOLDER } from "@/features/lead/cta";

import type { IndexPresentation, ReportModel } from "../types";
import { PentagonPdf } from "./pentagon-pdf";
import {
  PDF_BAND_FILL,
  PDF_BAND_LEVEL,
  PDF_COLORS,
  PDF_CONFIDENCE,
  PDF_FONT_FAMILY,
  PDF_FONT_WEIGHT,
} from "./theme";
import mk from "../../../../messages/mk.json";

const t = mk.reportPdf;
const legal = mk.legal;

export interface BuildReportDocumentOptions {
  /**
   * The booking link for the CTA, pre-built by the impure render seam via
   * `buildBookingHref(resolveBookingUrl(), city)` (spec — `?grad={city}`). The
   * builder stays pure: it receives the finished href, it does not read env.
   */
  bookingHref?: string;
}

// ── Puzzle-brain motif (mirrors `src/components/ui/puzzle-brain.tsx`) ──────────

/** Brain silhouette path (handover §2) — identical to the web component. */
const BRAIN_SIL =
  "M100,26 C92,16 78,14 70,22 C62,12 46,14 42,28 C30,22 18,32 22,46 " +
  "C10,50 8,66 18,74 C8,82 10,98 22,102 C16,114 24,130 40,130 " +
  "C44,144 64,150 76,140 C86,150 102,150 110,140 C122,150 142,146 146,130 " +
  "C162,132 174,118 168,104 C182,98 184,80 172,74 C184,66 180,48 166,46 " +
  "C166,30 148,22 138,30 C132,14 112,14 104,24 C103,24 101,24 100,26 Z";

/** Region rects/ellipse → index (assembly order); matches the web `REGIONS`. */
const BRAIN_REGIONS = [
  { key: "logic", d: "M0,0 H100 V96 H0 Z" },
  { key: "spatial", d: "M100,0 H200 V96 H100 Z" },
  { key: "planning", d: "M0,96 H100 V178 H0 Z" },
  { key: "stem", d: "M100,96 H200 V178 H100 Z" },
] as const;

/**
 * The assembled, color-coded puzzle-brain (the result motif). `assembled=false`
 * renders every region dim — used on the retry variant, where there is no
 * confident profile to show.
 */
function BrainMark({
  size = 52,
  assembled = true,
}: {
  size?: number;
  assembled?: boolean;
}) {
  const w = size;
  const h = Math.round((size * 178) / 200);
  return (
    // @react-pdf <Svg> via the same primitives the pentagon uses.
    <PentagonBrainSvg width={w} height={h}>
      <Path d={BRAIN_SIL} fill={PDF_COLORS.brainBase} />
      {/* clip the regions to the silhouette */}
      <BrainClip>
        {BRAIN_REGIONS.map((rg) => (
          <Path
            key={rg.key}
            d={rg.d}
            fill={assembled ? INDEX_BY_KEY[rg.key].color : PDF_COLORS.brainDim}
          />
        ))}
        <Ellipse
          cx={100}
          cy={88}
          rx={30}
          ry={34}
          fill={assembled ? INDEX_BY_KEY.memory.color : PDF_COLORS.brainDim}
        />
        {/* white puzzle seams */}
        <Line
          x1={100}
          y1={24}
          x2={100}
          y2={150}
          stroke={PDF_COLORS.white}
          strokeWidth={3}
        />
        <Line
          x1={22}
          y1={96}
          x2={178}
          y2={96}
          stroke={PDF_COLORS.white}
          strokeWidth={3}
        />
        <Ellipse
          cx={100}
          cy={88}
          rx={30}
          ry={34}
          fill="none"
          stroke={PDF_COLORS.white}
          strokeWidth={3}
        />
      </BrainClip>
      <Path
        d={BRAIN_SIL}
        fill="none"
        stroke={PDF_COLORS.pur}
        strokeOpacity={0.25}
        strokeWidth={2}
      />
    </PentagonBrainSvg>
  );
}

// Tiny wrappers so the brain SVG + clip-path read cleanly above.
function PentagonBrainSvg({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 178">
      {children}
    </Svg>
  );
}

const BRAIN_CLIP_ID = "brain-clip";

function BrainClip({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Defs>
        <ClipPath id={BRAIN_CLIP_ID}>
          <Path d={BRAIN_SIL} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${BRAIN_CLIP_ID})`}>{children}</G>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontWeight: PDF_FONT_WEIGHT.regular,
    fontSize: 9.5,
    lineHeight: 1.45,
    color: PDF_COLORS.ink,
    backgroundColor: PDF_COLORS.surface,
    paddingTop: 30,
    // Reserve room for the fixed footer (bottom:20 + the short §D.4 line). Since
    // 1.10 the footer is the one-line `legal.disclaimerShort`, so 72 is generous
    // headroom — a future copy/locale edit could wrap it to 2–3 lines and still
    // not draw over trailing flow content.
    paddingBottom: 72,
    paddingHorizontal: 34,
  },

  disclaimerTop: {
    fontSize: 7.5,
    lineHeight: 1.4,
    color: PDF_COLORS.muted,
    marginBottom: 12,
  },

  // Header
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerText: { flex: 1 },
  wordmark: {
    fontSize: 14,
    lineHeight: 1.2,
    fontWeight: PDF_FONT_WEIGHT.extrabold,
    color: PDF_COLORS.pur,
    letterSpacing: 0.3,
  },
  docTitle: {
    fontSize: 19,
    lineHeight: 1.2,
    fontWeight: PDF_FONT_WEIGHT.extrabold,
    color: PDF_COLORS.ink,
    marginTop: 1,
    marginBottom: 4,
  },
  docSubtitle: { fontSize: 9, lineHeight: 1.35, color: PDF_COLORS.muted },
  rule: { flexDirection: "row", marginTop: 12, marginBottom: 4 },
  ruleSeg: { flex: 1, height: 3 },

  intro: {
    fontSize: 9,
    color: PDF_COLORS.muted,
    marginTop: 8,
    marginBottom: 2,
  },

  // Part banner
  partBanner: {
    backgroundColor: PDF_COLORS.tintPur,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 12,
    marginBottom: 6,
  },
  partBannerText: {
    fontSize: 11,
    fontWeight: PDF_FONT_WEIGHT.bold,
    color: PDF_COLORS.pur,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: PDF_FONT_WEIGHT.bold,
    color: PDF_COLORS.ink,
    marginTop: 9,
  },

  // Profile (pentagon + bands)
  profileRow: { flexDirection: "row", gap: 14, marginBottom: 4 },
  pentagonWrap: {
    width: 200,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  bands: { flex: 1, gap: 9 },

  // Index band row
  bandTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bandName: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  bandLabel: {
    fontSize: 9.5,
    fontWeight: PDF_FONT_WEIGHT.semibold,
    color: PDF_COLORS.ink,
  },
  wordPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  wordPillText: { fontSize: 8.5, fontWeight: PDF_FONT_WEIGHT.semibold },
  pips: { flexDirection: "row", alignItems: "flex-end", gap: 1.4 },
  pip: { width: 2.4, borderRadius: 1 },

  track: {
    height: 6,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 3,
    overflow: "hidden",
  },
  trackFill: { height: 6, borderRadius: 4 },

  bandBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rangeText: { fontSize: 8, color: PDF_COLORS.muted },
  confidence: { flexDirection: "row", alignItems: "center", gap: 4 },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 1.4 },
  bar: { width: 2.2, borderRadius: 1 },
  confidenceText: { fontSize: 8 },

  // Narrative blocks
  blockTitle: {
    fontSize: 10,
    fontWeight: PDF_FONT_WEIGHT.semibold,
    color: PDF_COLORS.ink,
    marginTop: 8,
  },
  blockBody: { fontSize: 9.5, color: PDF_COLORS.ink, marginTop: 2 },
  extreme: {
    fontSize: 9.5,
    color: PDF_COLORS.ink,
    marginTop: 8,
    backgroundColor: PDF_COLORS.tintPur,
    borderRadius: 8,
    padding: 8,
  },

  // Activities
  activitiesIntro: {
    fontSize: 9,
    color: PDF_COLORS.muted,
    marginTop: 2,
    marginBottom: 3,
  },
  activityGroup: { marginTop: 5 },
  activityHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  activityHeadText: {
    fontSize: 9.5,
    fontWeight: PDF_FONT_WEIGHT.semibold,
    color: PDF_COLORS.ink,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 1.5,
    paddingLeft: 12,
  },
  bulletDot: { fontSize: 9.5, color: PDF_COLORS.pur },
  bulletText: { flex: 1, fontSize: 9.5, color: PDF_COLORS.ink },

  // Positioning
  program: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
    backgroundColor: PDF_COLORS.tintPur,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  programLabel: { fontSize: 8.5, color: PDF_COLORS.muted },
  programName: {
    fontSize: 10,
    fontWeight: PDF_FONT_WEIGHT.bold,
    color: PDF_COLORS.pur,
  },

  // CTA
  ctaBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: PDF_COLORS.borderPur,
    backgroundColor: PDF_COLORS.tintPur,
    borderRadius: 12,
    padding: 11,
  },
  ctaTitle: {
    fontSize: 11,
    fontWeight: PDF_FONT_WEIGHT.bold,
    color: PDF_COLORS.ink,
    marginBottom: 8,
  },
  ctaButton: {
    alignSelf: "flex-start",
    backgroundColor: PDF_COLORS.pur,
    color: PDF_COLORS.white,
    fontSize: 11,
    fontWeight: PDF_FONT_WEIGHT.bold,
    textDecoration: "none",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  dataNote: {
    fontSize: 7.5,
    lineHeight: 1.4,
    color: PDF_COLORS.muted,
    marginTop: 10,
  },

  // Fixed bottom footer (the short §D.4 disclaimer line at the bottom of every page).
  footer: {
    position: "absolute",
    bottom: 20,
    left: 34,
    right: 34,
    borderTopWidth: 0.5,
    borderTopColor: PDF_COLORS.border,
    paddingTop: 6,
  },
  footerText: { fontSize: 7, lineHeight: 1.4, color: PDF_COLORS.muted },

  // Retry
  retryBox: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: PDF_COLORS.borderPur,
    backgroundColor: PDF_COLORS.tintPur,
    borderRadius: 12,
    padding: 16,
  },
  retryTitle: {
    fontSize: 16,
    fontWeight: PDF_FONT_WEIGHT.bold,
    color: PDF_COLORS.ink,
    marginBottom: 6,
  },
  retryNote: { fontSize: 10, color: PDF_COLORS.ink },
});

// ── Small presentational pieces ───────────────────────────────────────────────

function Header({ assembled = true }: { assembled?: boolean }) {
  return (
    <View>
      <View style={s.header}>
        <BrainMark assembled={assembled} />
        <View style={s.headerText}>
          <Text style={s.wordmark}>{t.wordmark}</Text>
          <Text style={s.docTitle}>{t.docTitle}</Text>
          <Text style={s.docSubtitle}>{t.docSubtitle}</Text>
        </View>
      </View>
      {/* five index-colored segments — ties the header to the five areas */}
      <View style={s.rule}>
        {INDICES.map((m) => (
          <View key={m.key} style={[s.ruleSeg, { backgroundColor: m.color }]} />
        ))}
      </View>
    </View>
  );
}

function PartBanner({ children }: { children: string }) {
  return (
    <View style={s.partBanner}>
      <Text style={s.partBannerText}>{children}</Text>
    </View>
  );
}

function Pips({ level, color }: { level: number; color: string }) {
  return (
    <View style={s.pips}>
      {[1, 2, 3, 4].map((n) => (
        <View
          key={n}
          style={[
            s.pip,
            {
              height: 4 + n * 1.6,
              backgroundColor: n <= level ? color : PDF_COLORS.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

function ConfidenceGlyph({ bars, color }: { bars: number; color: string }) {
  return (
    <View style={s.bars}>
      {[1, 2, 3].map((n) => (
        <View
          key={n}
          style={[
            s.bar,
            {
              height: 3 + n * 2,
              backgroundColor: n <= bars ? color : PDF_COLORS.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

/** One per-index row — mirrors `IndexBandBar`: word + indicative range + confidence, never a number. */
function IndexRow({ idx }: { idx: IndexPresentation }) {
  const meta = INDEX_BY_KEY[idx.key];
  const fill = PDF_BAND_FILL[idx.band];
  const level = PDF_BAND_LEVEL[idx.band];
  const conf = PDF_CONFIDENCE[idx.confidence];
  const confWord = t.confidence[idx.confidence];
  return (
    <View>
      <View style={s.bandTopRow}>
        <View style={s.bandName}>
          <View style={[s.dot, { backgroundColor: meta.color }]} />
          <Text style={s.bandLabel}>{idx.label}</Text>
        </View>
        <View style={[s.wordPill, { backgroundColor: meta.soft }]}>
          <Pips level={level} color={meta.ink} />
          <Text style={[s.wordPillText, { color: meta.ink }]}>
            {idx.wordLabel}
          </Text>
        </View>
      </View>

      <View style={[s.track, { backgroundColor: meta.soft }]}>
        <View
          style={[
            s.trackFill,
            { width: `${fill * 100}%`, backgroundColor: meta.color },
          ]}
        />
      </View>

      <View style={s.bandBottomRow}>
        <Text style={s.rangeText}>{idx.range}</Text>
        <View style={s.confidence}>
          <ConfidenceGlyph bars={conf.bars} color={conf.color} />
          <Text style={[s.confidenceText, { color: conf.color }]}>
            {t.confidencePrefix}: {confWord}
          </Text>
        </View>
      </View>
    </View>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <View>
      <Text style={s.blockTitle}>{title}</Text>
      <Text style={s.blockBody}>{text}</Text>
    </View>
  );
}

// ── The document ──────────────────────────────────────────────────────────────

/** Pure: build the `<Document>` element tree for a `ReportModel`. */
export function buildReportDocument(
  model: ReportModel,
  options: BuildReportDocumentOptions = {},
) {
  const bookingHref = options.bookingHref ?? BOOKING_URL_PLACEHOLDER;

  if (model.variant === "retry") {
    return (
      <Document>
        <Page size="A4" style={s.page}>
          {/* §16.1 placement #4 — TOP (full §D.4). */}
          <Text style={s.disclaimerTop}>{legal.disclaimer}</Text>
          <Header assembled={false} />
          <View style={s.retryBox}>
            <Text style={s.retryTitle}>{mk.confirmation.retryTitle}</Text>
            <Text style={s.retryNote}>
              {model.validity.note ?? mk.confirmation.retryNote}
            </Text>
          </View>
          {/* §16.1 placement #4 — BOTTOM (short line), fixed on every page. */}
          <View style={s.footer} fixed>
            <Text style={s.footerText}>{legal.disclaimerShort}</Text>
          </View>
        </Page>
      </Document>
    );
  }

  const indices = model.indices ?? [];
  const partA = model.partA;
  const partB = model.partB;
  const positioning = model.positioning;
  const ctaText = model.cta?.text ?? t.ctaFallback;
  const activityGroups = (partA?.activities ?? []).filter(
    (a) => a.items.length > 0,
  );

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* §16.1 placement #4 — TOP placement (full §D.4 paragraph). */}
        <Text style={s.disclaimerTop}>{legal.disclaimer}</Text>

        <Header assembled />
        <Text style={s.intro}>{t.intro}</Text>

        {/* ── Part А · Cognitive profile ── */}
        <PartBanner>{t.partATitle}</PartBanner>

        <Text style={s.sectionTitle}>{t.profileTitle}</Text>
        <View style={s.profileRow}>
          <View style={s.pentagonWrap}>
            <PentagonPdf values={indices.map((i) => i.value)} size={190} />
          </View>
          <View style={s.bands}>
            {indices.map((idx) => (
              <IndexRow key={idx.key} idx={idx} />
            ))}
          </View>
        </View>

        {partA && (
          <>
            <Block title={t.strengthTitle} text={partA.topStrength.text} />
            <Block title={t.growthTitle} text={partA.growthArea.text} />
            <Block title={t.styleTitle} text={partA.solvingStyle.text} />
            {partA.extreme && (
              <Text style={s.extreme}>{partA.extreme.text}</Text>
            )}

            {activityGroups.length > 0 && (
              <View>
                <Text style={s.blockTitle}>{t.activitiesTitle}</Text>
                <Text style={s.activitiesIntro}>{t.activitiesIntro}</Text>
                {activityGroups.map((group) => {
                  const meta = INDEX_BY_KEY[group.index];
                  return (
                    <View
                      key={group.index}
                      style={s.activityGroup}
                      wrap={false}
                    >
                      <View style={s.activityHead}>
                        <View
                          style={[s.dot, { backgroundColor: meta.color }]}
                        />
                        <Text style={s.activityHeadText}>{meta.label}</Text>
                      </View>
                      {group.items.map((item, i) => (
                        <View key={i} style={s.bulletRow}>
                          <Text style={s.bulletDot}>·</Text>
                          <Text style={s.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* ── Part Б · STEM readiness ── */}
        {partB && (
          <>
            <PartBanner>{t.partBTitle}</PartBanner>
            <Block title={t.readinessTitle} text={partB.readiness.text} />
            <Block title={t.bridgeTitle} text={partB.stemBridge.text} />
          </>
        )}

        {/* ── IQ UP! positioning ── */}
        {positioning && (
          <View>
            <Text style={s.sectionTitle}>{t.positioningTitle}</Text>
            {positioning.text && (
              <Text style={s.blockBody}>{positioning.text}</Text>
            )}
            {positioning.program.name && (
              <View style={s.program}>
                <Text style={s.programLabel}>{t.programLabel}:</Text>
                <Text style={s.programName}>{positioning.program.name}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── CTA — clickable booking link (?grad={city}) ── */}
        <View style={s.ctaBox}>
          <Text style={s.ctaTitle}>{t.ctaTitle}</Text>
          <Link src={bookingHref} style={s.ctaButton}>
            {ctaText}
          </Link>
        </View>

        {/* §D.2 data note (reused legal copy). */}
        <Text style={s.dataNote}>{legal.dataNote}</Text>

        {/* §D.4 disclaimer — BOTTOM placement (short line), fixed footer on every page. */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{legal.disclaimerShort}</Text>
        </View>
      </Page>
    </Document>
  );
}
