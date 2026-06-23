/**
 * Minimal ambient types for `fontkit` (a transitive dep of `@react-pdf/renderer`,
 * which ships no type declarations). Used only by the 1.09 font-coverage test to
 * verify Macedonian Cyrillic glyph coverage in the bundled Montserrat TTFs.
 */
declare module "fontkit" {
  export interface FontkitFont {
    hasGlyphForCodePoint(codePoint: number): boolean;
  }
  export function create(buffer: Uint8Array): FontkitFont;
  export function openSync(path: string): FontkitFont;
}
