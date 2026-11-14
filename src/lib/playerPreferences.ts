export type PreferredVideoResolution = 'max' | '2160' | '1080' | '720' | '480' | '360';

export type PlayerPreferences = {
  alwaysStretchToFill: boolean;
  alwaysPlayWithCaptions: boolean;
  showExpandedVideoTitle: boolean;
  showVideoEndTime: boolean;
  showPlaybackInfo: boolean;
  showPausedRecommendations: boolean;
  showPausedCast: boolean;
  showPausedOverlayBackground: boolean;
  pausedRelatedItemCount: number;
  pausedRelatedItemWidth: number;
  autoPictureInPictureOnBlur: boolean;
  preferredVideoResolution: PreferredVideoResolution;
};

export const PLAYER_PREFERENCES_STORAGE_KEY = 'jellytube.playerPreferences';

export const DEFAULT_PLAYER_PREFERENCES: PlayerPreferences = {
  alwaysStretchToFill: false,
  alwaysPlayWithCaptions: false,
  showExpandedVideoTitle: false,
  showVideoEndTime: false,
  showPlaybackInfo: true,
  showPausedRecommendations: true,
  showPausedCast: true,
  showPausedOverlayBackground: true,
  pausedRelatedItemCount: 4,
  pausedRelatedItemWidth: 210,
  autoPictureInPictureOnBlur: false,
  preferredVideoResolution: 'max'
};

const preferredVideoResolutions: PreferredVideoResolution[] = [
  'max',
  '2160',
  '1080',
  '720',
  '480',
  '360'
];
const preferredVideoResolutionSet: ReadonlySet<string> = new Set(preferredVideoResolutions);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPreferredVideoResolution(value: unknown): value is PreferredVideoResolution {
  return typeof value === 'string' && preferredVideoResolutionSet.has(value);
}

function boundedIntegerPreference(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function parsePlayerPreferences(value: string | null | undefined): PlayerPreferences {
  if (!value) return { ...DEFAULT_PLAYER_PREFERENCES };

  try {
    const stored: unknown = JSON.parse(value);
    if (!isRecord(stored)) return { ...DEFAULT_PLAYER_PREFERENCES };
    return {
      alwaysStretchToFill: stored.alwaysStretchToFill === true,
      alwaysPlayWithCaptions: stored.alwaysPlayWithCaptions === true,
      showExpandedVideoTitle: stored.showExpandedVideoTitle === true,
      showVideoEndTime: stored.showVideoEndTime === true,
      showPlaybackInfo: stored.showPlaybackInfo !== false,
      showPausedRecommendations: stored.showPausedRecommendations !== false,
      showPausedCast: stored.showPausedCast !== false,
      showPausedOverlayBackground:
        stored.showPausedOverlayBackground !== false && stored.showPausedOverlayShadow !== false,
      pausedRelatedItemCount: boundedIntegerPreference(stored.pausedRelatedItemCount, 4, 2, 8),
      pausedRelatedItemWidth: boundedIntegerPreference(stored.pausedRelatedItemWidth, 210, 120, 320),
      autoPictureInPictureOnBlur: stored.autoPictureInPictureOnBlur === true,
      preferredVideoResolution: isPreferredVideoResolution(stored.preferredVideoResolution)
        ? stored.preferredVideoResolution
        : 'max'
    };
  } catch {
    return { ...DEFAULT_PLAYER_PREFERENCES };
  }
}

export function loadPlayerPreferences(): PlayerPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_PLAYER_PREFERENCES };
  return parsePlayerPreferences(window.localStorage.getItem(PLAYER_PREFERENCES_STORAGE_KEY));
}

export function savePlayerPreferences(preferences: PlayerPreferences) {
  window.localStorage.setItem(PLAYER_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}
