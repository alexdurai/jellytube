import type { JellyfinTrickplayInfo, JellyfinTrickplayManifest } from './types';

export type TrickplayResolution = {
  width: number;
  info: JellyfinTrickplayInfo;
};

export type TrickplayTile = {
  index: number;
  column: number;
  row: number;
};

function isValidTrickplayInfo(info: JellyfinTrickplayInfo) {
  return (
    Number.isInteger(info.Width) &&
    info.Width > 0 &&
    Number.isInteger(info.Height) &&
    info.Height > 0 &&
    Number.isInteger(info.TileWidth) &&
    info.TileWidth > 0 &&
    Number.isInteger(info.TileHeight) &&
    info.TileHeight > 0 &&
    Number.isInteger(info.ThumbnailCount) &&
    info.ThumbnailCount > 0 &&
    Number.isFinite(info.Interval) &&
    info.Interval > 0
  );
}

export function trickplayResolutionForSource(
  manifest: JellyfinTrickplayManifest | undefined,
  mediaSourceId: string | undefined,
  targetWidth = 320
): TrickplayResolution | undefined {
  if (!mediaSourceId) return undefined;
  const sourceManifest = manifest?.[mediaSourceId];
  if (!sourceManifest) return undefined;

  const resolutions = Object.entries(sourceManifest)
    .map(([width, info]) => ({ width: Number(width), info }))
    .filter(
      (resolution) =>
        Number.isInteger(resolution.width) &&
        resolution.width > 0 &&
        isValidTrickplayInfo(resolution.info)
    )
    .sort((a, b) => a.width - b.width);

  return (
    resolutions.find((resolution) => resolution.width >= targetWidth) ??
    resolutions[resolutions.length - 1]
  );
}

export function trickplayTileAt(
  info: JellyfinTrickplayInfo,
  timeSeconds: number
): TrickplayTile | undefined {
  if (!isValidTrickplayInfo(info) || !Number.isFinite(timeSeconds) || timeSeconds < 0) {
    return undefined;
  }

  const thumbnailIndex = Math.floor((timeSeconds * 1000) / info.Interval);
  if (thumbnailIndex >= info.ThumbnailCount) return undefined;

  const thumbnailsPerTile = info.TileWidth * info.TileHeight;
  const thumbnailOffset = thumbnailIndex % thumbnailsPerTile;
  return {
    index: Math.floor(thumbnailIndex / thumbnailsPerTile),
    column: thumbnailOffset % info.TileWidth,
    row: Math.floor(thumbnailOffset / info.TileWidth)
  };
}
