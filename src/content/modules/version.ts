/**
 * Module-library version (spec Дел 9 / 19.4). Bumped whenever any authored module
 * text, activity, trigger or coverage changes, and stored in `ReportModel.meta`
 * so every report is reproducible from a known content version.
 *
 * The library is versioned CONTENT, not UI strings (resolved-decision 6): it lives
 * here, never in `messages/mk.json`. Only the report's UI chrome (section
 * headings) goes through next-intl.
 *
 * 1.1.0 (Feat-Serbian-Localization): every module gained a Serbian (`sr`) register
 * alongside the Macedonian source. MINOR, not MAJOR: the Macedonian output is
 * byte-for-byte unchanged, and this version is carried only in `ReportModel.meta`,
 * NOT in the anonymous score row — so it does not affect record comparability.
 */
export const MODULE_LIBRARY_VERSION = "1.1.0";
