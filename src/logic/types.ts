/** Index into `NUT_TYPES` (0..7). */
export type NutType = number;

/** The nuts on one bolt, bottom → top. */
export type Bolt = readonly NutType[];

export type Layout = readonly Bolt[];

/** Take the top nut of bolt `from` and put it on bolt `to`. */
export type Move = readonly [from: number, to: number];

export type Level = {
  /** 1-based level number. */
  id: number;
  types: number;
  layout: Layout;
  /** Proven minimum number of moves. */
  par: number;
  /** One optimal solution, `par` moves long. */
  solution: Move[];
};
