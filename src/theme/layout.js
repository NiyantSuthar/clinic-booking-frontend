/**
 * Single shared value for the responsive pass - one number, applied
 * consistently everywhere, per the "one consistent pattern" requirement.
 * 600 is a reasonable readable-form width - narrower than most small
 * tablets in portrait (768px+), wide enough that admin's table columns
 * don't feel cramped. On any phone (which are all narrower than this),
 * this has zero visual effect - the screen's natural width already wins.
 */
export const MAX_CONTENT_WIDTH = 600;
