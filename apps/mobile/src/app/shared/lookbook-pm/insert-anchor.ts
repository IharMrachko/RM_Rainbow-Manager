/**
 * Last place the user tapped in the lookbook editor.
 * CSS `transform: scale(...)` breaks ProseMirror posAtCoords, so selection
 * often jumps to the top — we book inserts from DOM hits instead.
 */
let bookedPos: number | null = null;

export const LookbookInsertAnchor = {
  get(): number | null {
    return bookedPos;
  },

  set(pos: number | null): void {
    if (pos == null || pos < 0 || !Number.isFinite(pos)) {
      bookedPos = null;
      return;
    }
    bookedPos = Math.floor(pos);
  },

  clear(): void {
    bookedPos = null;
  },
};
