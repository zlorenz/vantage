/**
 *   npx tsx src/lib/mp4-keyframes.test.ts
 */

import assert from 'node:assert/strict';
import {keyframeTimestampsFromMoov, readBoxHeader} from './mp4-keyframes';

function box(type: string, payload: Buffer): Buffer {
  const size = 8 + payload.length;
  const header = Buffer.alloc(8);
  header.writeUInt32BE(size, 0);
  header.write(type, 4, 4, 'ascii');
  return Buffer.concat([header, payload]);
}

function u32(value: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(value, 0);
  return buf;
}

function mdhd(timescale: number, duration: number): Buffer {
  const payload = Buffer.alloc(24);
  payload.writeUInt32BE(timescale, 12);
  payload.writeUInt32BE(duration, 16);
  return box('mdhd', payload);
}

function hdlr(handler: string): Buffer {
  const payload = Buffer.alloc(24);
  payload.write(handler, 8, 4, 'ascii');
  return box('hdlr', payload);
}

function stts(count: number, delta: number): Buffer {
  const payload = Buffer.concat([Buffer.alloc(4), u32(1), u32(count), u32(delta)]);
  return box('stts', payload);
}

function stss(samples: number[]): Buffer {
  const payload = Buffer.concat([Buffer.alloc(4), u32(samples.length), ...samples.map(u32)]);
  return box('stss', payload);
}

function videoTrak(syncSamples: number[]): Buffer {
  const stbl = box('stbl', Buffer.concat([stts(200, 1), stss(syncSamples)]));
  const minf = box('minf', stbl);
  const mdia = box('mdia', Buffer.concat([mdhd(25, 200), hdlr('vide'), minf]));
  return box('trak', mdia);
}

function audioTrak(): Buffer {
  const stbl = box('stbl', stts(10, 1024));
  const minf = box('minf', stbl);
  const mdia = box('mdia', Buffer.concat([mdhd(44100, 10240), hdlr('soun'), minf]));
  return box('trak', mdia);
}

function testReadsSyncSampleTimes() {
  const moov = box('moov', Buffer.concat([audioTrak(), videoTrak([1, 77, 153])]));
  const times = keyframeTimestampsFromMoov(new Uint8Array(moov));
  assert.deepEqual(times, [0, 3.04, 6.08]);
}

function testIgnoresAudioOnly() {
  const moov = box('moov', audioTrak());
  assert.deepEqual(keyframeTimestampsFromMoov(new Uint8Array(moov)), []);
}

function testRejectsNonMoov() {
  const ftyp = box('ftyp', Buffer.from('isom'));
  assert.deepEqual(keyframeTimestampsFromMoov(new Uint8Array(ftyp)), []);
}

function testReadBoxHeader() {
  const ftyp = box('ftyp', Buffer.from('isom'));
  const header = readBoxHeader(new Uint8Array(ftyp), 0);
  assert.equal(header?.type, 'ftyp');
  assert.equal(header?.size, ftyp.length);
}

const tests = [
  testReadsSyncSampleTimes,
  testIgnoresAudioOnly,
  testRejectsNonMoov,
  testReadBoxHeader,
];

for (const test of tests) {
  test();
  console.log(`ok ${test.name}`);
}

console.log(`\n${tests.length} passed`);
