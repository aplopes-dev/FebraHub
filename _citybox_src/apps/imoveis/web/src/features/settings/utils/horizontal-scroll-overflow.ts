export type HorizontalScrollOverflow = {
  canScrollStart: boolean;
  canScrollEnd: boolean;
};

const THRESHOLD_PX = 4;

/** Lê se um container horizontal ainda tem conteúdo escondido nas bordas. */
export function readHorizontalScrollOverflow(
  element: {
    scrollLeft: number;
    scrollWidth: number;
    clientWidth: number;
  },
  threshold = THRESHOLD_PX,
): HorizontalScrollOverflow {
  const maxScroll = element.scrollWidth - element.clientWidth;
  if (maxScroll <= threshold) {
    return { canScrollStart: false, canScrollEnd: false };
  }
  return {
    canScrollStart: element.scrollLeft > threshold,
    canScrollEnd: element.scrollLeft < maxScroll - threshold,
  };
}
