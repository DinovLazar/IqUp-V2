/**
 * Type guards for narrowing an {@link Item}. The Gf families (matrix vs series)
 * differ in `options`/`meta` shape but share `signal: "gf"`, so a nested check on
 * `stimulus.family` does not narrow the parent union — these guards do. Useful in
 * the renderer (1.06) and scorer (1.05) too, not just the tests.
 */

import type {
  CtItem,
  EfItem,
  GfItem,
  GfMatrixItem,
  GfSeriesItem,
  GlrItem,
  GsItem,
  GsmItem,
  GvItem,
  Item,
} from "./types";

export const isGf = (i: Item): i is GfItem => i.signal === "gf";
export const isGv = (i: Item): i is GvItem => i.signal === "gv";
export const isGsm = (i: Item): i is GsmItem => i.signal === "gsm";
export const isGs = (i: Item): i is GsItem => i.signal === "gs";
export const isEf = (i: Item): i is EfItem => i.signal === "ef";
export const isGlr = (i: Item): i is GlrItem => i.signal === "glr";
export const isCt = (i: Item): i is CtItem => i.signal === "ct";

export const isGfMatrix = (i: Item): i is GfMatrixItem =>
  i.signal === "gf" && i.stimulus.family === "matrix";
export const isGfSeries = (i: Item): i is GfSeriesItem =>
  i.signal === "gf" && i.stimulus.family === "series";
