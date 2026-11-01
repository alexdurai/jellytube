import type { JellyfinItem, JellyfinMediaSegment } from './types';

const INTRO_CHAPTER_PATTERN = /^intro(?: start)?$/i;
const INTRO_END_CHAPTER_PATTERN = /^intro end$/i;
const OUTRO_CHAPTER_PATTERN = /^(outro|credits)$/i;
const INTRO_SEGMENT_TYPE = 'Intro';
const OUTRO_SEGMENT_TYPE = 'Outro';
const SKIP_GRACE_SECONDS = 2;

export type IntroWindow = {
  start: number;
  end: number;
};

/**
 * Converts the media segments response (Intro Skipper exposes its detections
 * through the server's MediaSegments API) into a window. Segment times are
 * ticks; only the "Intro" segment type is relevant here.
 */
export function introWindowFromSegments(
  segments: JellyfinMediaSegment[] | null | undefined
): IntroWindow | null {
  return segmentWindowFromSegments(segments, INTRO_SEGMENT_TYPE);
}

export function outroWindowFromSegments(
  segments: JellyfinMediaSegment[] | null | undefined
): IntroWindow | null {
  return segmentWindowFromSegments(segments, OUTRO_SEGMENT_TYPE);
}

function segmentWindowFromSegments(
  segments: JellyfinMediaSegment[] | null | undefined,
  type: string
): IntroWindow | null {
  const segment = Array.isArray(segments)
    ? segments.find((candidate) => candidate.Type === type)
    : null;
  if (!segment) return null;
  const start = ticksToSeconds(segment.StartTicks);
  const end = ticksToSeconds(segment.EndTicks);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return { start, end };
}

/**
 * Converts an item's Intro chapter into a [start, end] window in seconds, or
 * null. Chapters may carry only a start position, so the end is
 * inferred from the next chapter's start, falling back to the episode
 * runtime when the Intro chapter is the last one. An explicit end position
 * (if a server ever provides one) takes precedence.
 */
export function introWindowForItem(item: JellyfinItem): IntroWindow | null {
  return chapterWindowForItem(item, INTRO_CHAPTER_PATTERN);
}

export function outroWindowForItem(item: JellyfinItem): IntroWindow | null {
  return chapterWindowForItem(item, OUTRO_CHAPTER_PATTERN);
}

function chapterWindowForItem(item: JellyfinItem, pattern: RegExp): IntroWindow | null {
  const chapters = item.Chapters ?? [];
  const index = chapters.findIndex((candidate) => pattern.test(candidate.Name?.trim() ?? ''));
  if (index === -1) return null;
  const chapter = chapters[index];
  const start = ticksToSeconds(chapter.StartPositionTicks);
  const endMarker = pattern === INTRO_CHAPTER_PATTERN
    ? chapters.slice(index + 1).find((candidate) => INTRO_END_CHAPTER_PATTERN.test(candidate.Name?.trim() ?? ''))
    : undefined;
  const explicitEnd = ticksToSeconds(chapter.EndPositionTicks);
  const markedEnd = ticksToSeconds(endMarker?.StartPositionTicks);
  const nextStart = ticksToSeconds(chapters[index + 1]?.StartPositionTicks);
  const end =
    (Number.isFinite(markedEnd) && markedEnd > start ? markedEnd : NaN) ||
    (Number.isFinite(explicitEnd) && explicitEnd > start ? explicitEnd : NaN) ||
    (Number.isFinite(nextStart) && nextStart > start ? nextStart : NaN) ||
    ticksToSeconds(item.RunTimeTicks);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return { start, end };
}

/**
 * Resolves the effective intro window for playback: the server's detected
 * media segment first, falling back to embedded "Intro" chapters in the file.
 */
export function introWindowForPlayback(
  segments: JellyfinMediaSegment[] | null | undefined,
  item: JellyfinItem
): IntroWindow | null {
  return introWindowFromSegments(segments) ?? introWindowForItem(item);
}

export function outroWindowForPlayback(
  segments: JellyfinMediaSegment[] | null | undefined,
  item: JellyfinItem
): IntroWindow | null {
  return outroWindowFromSegments(segments) ?? outroWindowForItem(item);
}

/**
 * Whether the skip button should be visible for a playback position.
 * Hidden while dismissed, before the intro starts, and inside the last
 * grace seconds so it disappears just before the show resumes.
 */
export function shouldShowSkipIntro(
  currentSeconds: number,
  intro: IntroWindow | null,
  dismissed: boolean
): boolean {
  if (!intro || dismissed) return false;
  if (currentSeconds < intro.start) return false;
  return currentSeconds < intro.end - SKIP_GRACE_SECONDS;
}

export function shouldShowSkipOutro(
  currentSeconds: number,
  outro: IntroWindow | null,
  dismissed: boolean
): boolean {
  if (!outro || dismissed) return false;
  return currentSeconds >= outro.start && currentSeconds < outro.end;
}

function ticksToSeconds(ticks?: number): number {
  return typeof ticks === 'number' && Number.isFinite(ticks) ? ticks / 10_000_000 : NaN;
}
