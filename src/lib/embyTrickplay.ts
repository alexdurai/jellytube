export type EmbyTrickplayFrame = {
  timestampMs: number;
  bytes: Uint8Array;
};

const BIF_MAGIC = [0x89, 0x42, 0x49, 0x46, 0x0d, 0x0a, 0x1a, 0x0a];

export function parseEmbyBif(buffer: ArrayBuffer): EmbyTrickplayFrame[] {
  if (buffer.byteLength < 64) return [];

  const bytes = new Uint8Array(buffer);
  if (!BIF_MAGIC.every((value, index) => bytes[index] === value)) return [];

  const data = new DataView(buffer);
  const imageCount = data.getUint32(12, true);
  const timestampMultiplier = data.getUint32(16, true) || 1000;
  const indexTableEnd = 64 + (imageCount + 1) * 8;
  if (!Number.isSafeInteger(indexTableEnd) || indexTableEnd > buffer.byteLength) return [];

  const frames: EmbyTrickplayFrame[] = [];
  for (let index = 0; index < imageCount; index += 1) {
    const entryOffset = 64 + index * 8;
    const nextEntryOffset = entryOffset + 8;
    const timestamp = data.getUint32(entryOffset, true);
    const imageOffset = data.getUint32(entryOffset + 4, true);
    const nextImageOffset = data.getUint32(nextEntryOffset + 4, true);

    if (
      imageOffset < indexTableEnd ||
      nextImageOffset <= imageOffset ||
      nextImageOffset > buffer.byteLength
    ) {
      continue;
    }

    frames.push({
      timestampMs: timestamp * timestampMultiplier,
      bytes: bytes.subarray(imageOffset, nextImageOffset)
    });
  }

  return frames;
}

export function embyTrickplayFrameAt(
  frames: EmbyTrickplayFrame[],
  timeSeconds: number
): EmbyTrickplayFrame | undefined {
  if (!frames.length || !Number.isFinite(timeSeconds) || timeSeconds < 0) return undefined;

  const timeMs = timeSeconds * 1000;
  let low = 0;
  let high = frames.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (frames[middle].timestampMs <= timeMs) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }
  return frames[low];
}
