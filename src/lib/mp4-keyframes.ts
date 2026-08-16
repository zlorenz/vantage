/**
 * Parse H264 sync-sample timestamps from an MP4 moov atom.
 * Used by /api/vimeo-keyframes/[id] so Studio can offer real keyframe times
 * without downloading or decoding the media payload.
 */

const CONTAINER_TYPES = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'udta']);
const PREFIX_BYTES = 8 * 1024;
const MAX_MOOV_BYTES = 2 * 1024 * 1024;

type Box = {
  type: string;
  size: number;
  headerSize: number;
  start: number;
};

function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset);
}

function readU64(view: DataView, offset: number): number {
  const high = view.getUint32(offset);
  const low = view.getUint32(offset + 4);
  return high * 0x1_0000_0000 + low;
}

function typeAt(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3],
  );
}

export function readBoxHeader(bytes: Uint8Array, start: number): Box | null {
  if (start + 8 > bytes.length) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let size = readU32(view, start);
  let headerSize = 8;
  const type = typeAt(bytes, start + 4);
  if (size === 1) {
    if (start + 16 > bytes.length) return null;
    size = readU64(view, start + 8);
    headerSize = 16;
  }
  if (size !== 0 && size < headerSize) return null;
  return {type, size, headerSize, start};
}

function children(bytes: Uint8Array, box: Box): Box[] {
  const out: Box[] = [];
  const end = box.size === 0 ? bytes.length : Math.min(bytes.length, box.start + box.size);
  let offset = box.start + box.headerSize;
  while (offset + 8 <= end) {
    const child = readBoxHeader(bytes, offset);
    if (!child || child.size < child.headerSize) break;
    const next = child.size === 0 ? end : offset + child.size;
    if (next > end) break;
    out.push(child);
    if (child.size === 0) break;
    offset = next;
  }
  return out;
}

function descendants(bytes: Uint8Array, box: Box, type: string): Box[] {
  const found: Box[] = [];
  for (const child of children(bytes, box)) {
    if (child.type === type) found.push(child);
    if (CONTAINER_TYPES.has(child.type)) {
      found.push(...descendants(bytes, child, type));
    }
  }
  return found;
}

function payload(bytes: Uint8Array, box: Box): Uint8Array {
  const end = box.size === 0 ? bytes.length : box.start + box.size;
  return bytes.subarray(box.start + box.headerSize, end);
}

function parseHdlr(body: Uint8Array): string {
  if (body.length < 12) return '';
  return String.fromCharCode(body[8], body[9], body[10], body[11]);
}

function parseMdhd(body: Uint8Array): {timescale: number; duration: number} | null {
  if (body.length < 16) return null;
  const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
  const version = body[0];
  if (version === 1) {
    if (body.length < 32) return null;
    return {timescale: readU32(view, 20), duration: readU64(view, 24)};
  }
  return {timescale: readU32(view, 12), duration: readU32(view, 16)};
}

function parseStts(body: Uint8Array): Array<{count: number; delta: number}> {
  if (body.length < 8) return [];
  const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
  const entryCount = readU32(view, 4);
  const entries: Array<{count: number; delta: number}> = [];
  let offset = 8;
  for (let i = 0; i < entryCount && offset + 8 <= body.length; i++) {
    entries.push({count: readU32(view, offset), delta: readU32(view, offset + 4)});
    offset += 8;
  }
  return entries;
}

function parseStss(body: Uint8Array): number[] {
  if (body.length < 8) return [];
  const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
  const entryCount = readU32(view, 4);
  const samples: number[] = [];
  let offset = 8;
  for (let i = 0; i < entryCount && offset + 4 <= body.length; i++) {
    samples.push(readU32(view, offset));
    offset += 4;
  }
  return samples;
}

function sampleDts(entries: Array<{count: number; delta: number}>, sampleNumber: number): number {
  let remaining = sampleNumber - 1;
  let dts = 0;
  for (const {count, delta} of entries) {
    if (remaining < count) return dts + remaining * delta;
    dts += count * delta;
    remaining -= count;
  }
  return dts;
}

function roundSeconds(value: number): number {
  return Math.round(value * 1e4) / 1e4;
}

/**
 * Walk a complete moov box (including its 8-byte header) and return video
 * keyframe timestamps in seconds. Audio tracks are ignored.
 */
export function keyframeTimestampsFromMoov(moov: Uint8Array): number[] {
  const header = readBoxHeader(moov, 0);
  if (!header || header.type !== 'moov') return [];

  for (const trak of children(moov, header)) {
    if (trak.type !== 'trak') continue;
    const hdlr = descendants(moov, trak, 'hdlr')[0];
    if (!hdlr || parseHdlr(payload(moov, hdlr)) !== 'vide') continue;
    const mdhdBox = descendants(moov, trak, 'mdhd')[0];
    const sttsBox = descendants(moov, trak, 'stts')[0];
    if (!mdhdBox || !sttsBox) continue;
    const mdhd = parseMdhd(payload(moov, mdhdBox));
    if (!mdhd || mdhd.timescale <= 0) continue;
    const stts = parseStts(payload(moov, sttsBox));
    const stssBox = descendants(moov, trak, 'stss')[0];
    const totalSamples = stts.reduce((sum, entry) => sum + entry.count, 0);
    const sync = stssBox
      ? parseStss(payload(moov, stssBox))
      : totalSamples > 0 && totalSamples <= 200
        ? Array.from({length: totalSamples}, (_, i) => i + 1)
        : [];
    return sync.map((sample) => roundSeconds(sampleDts(stts, sample) / mdhd.timescale));
  }
  return [];
}

function topLevelBoxes(bytes: Uint8Array): Box[] {
  const boxes: Box[] = [];
  let offset = 0;
  while (offset + 8 <= bytes.length) {
    const box = readBoxHeader(bytes, offset);
    if (!box) break;
    boxes.push(box);
    if (box.size === 0) break;
    offset += box.size;
    if (offset > bytes.length) break;
  }
  return boxes;
}

async function rangeBytes(url: string, start: number, end: number): Promise<Uint8Array> {
  const response = await fetch(url, {
    headers: {Range: `bytes=${start}-${end}`, 'User-Agent': 'vantage-keyframes'},
    cache: 'no-store',
  });
  if (!response.ok && response.status !== 206) {
    throw new Error(`range_failed:${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

/**
 * Range-request just the moov atom from a progressive MP4 URL.
 * Fast-start files (Vimeo) have moov after ftyp; non-fast-start still works
 * when mdat has a sized header.
 */
export async function fetchMoovAtom(url: string): Promise<Uint8Array> {
  const prefix = await rangeBytes(url, 0, PREFIX_BYTES - 1);
  const boxes = topLevelBoxes(prefix);
  const moov = boxes.find((box) => box.type === 'moov');
  if (moov && moov.size > 0) {
    if (moov.size > MAX_MOOV_BYTES) {
      throw new Error('moov_too_large');
    }
    if (moov.start + moov.size <= prefix.length) {
      return prefix.subarray(moov.start, moov.start + moov.size);
    }
    return rangeBytes(url, moov.start, moov.start + moov.size - 1);
  }

  const mdat = boxes.find((box) => box.type === 'mdat');
  if (mdat && mdat.size > 8) {
    const moovAt = mdat.start + mdat.size;
    const header = await rangeBytes(url, moovAt, moovAt + 15);
    const moovHeader = readBoxHeader(header, 0);
    if (!moovHeader || moovHeader.type !== 'moov' || moovHeader.size <= 0) {
      throw new Error('moov_not_found');
    }
    if (moovHeader.size > MAX_MOOV_BYTES) {
      throw new Error('moov_too_large');
    }
    return rangeBytes(url, moovAt, moovAt + moovHeader.size - 1);
  }

  throw new Error('moov_not_found');
}
