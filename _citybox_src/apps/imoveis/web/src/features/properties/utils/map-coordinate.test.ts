import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatMapCoordinate,
  osmEmbedUrl,
  parseMapCoordinate,
  sameLatLng,
} from './map-coordinate';

describe('parseMapCoordinate', () => {
  it('parses lat, lng with spaces', () => {
    const coords = parseMapCoordinate('-14.8142, -39.0340');
    assert.deepEqual(coords, { lat: -14.8142, lng: -39.034 });
  });

  it('returns null for empty or invalid values', () => {
    assert.equal(parseMapCoordinate(''), null);
    assert.equal(parseMapCoordinate('Ilhéus'), null);
    assert.equal(parseMapCoordinate('91, 0'), null);
  });
});

describe('osmEmbedUrl', () => {
  it('points at OpenStreetMap embed with a marker', () => {
    const url = osmEmbedUrl({ lat: -14.8, lng: -39.03 });
    assert.match(url, /^https:\/\/www\.openstreetmap\.org\/export\/embed\.html\?/);
    assert.match(url, /marker=-14\.8%2C-39\.03/);
  });
});

describe('formatMapCoordinate', () => {
  it('round-trips through parseMapCoordinate', () => {
    const formatted = formatMapCoordinate(-14.8142, -39.034);
    const parsed = parseMapCoordinate(formatted);
    assert.ok(parsed);
    assert.ok(Math.abs(parsed.lat - -14.8142) < 1e-6);
    assert.ok(Math.abs(parsed.lng - -39.034) < 1e-6);
  });
});

describe('sameLatLng', () => {
  it('treats a dragged pin as the same point (sub-meter jitter)', () => {
    assert.equal(
      sameLatLng(
        { lat: -14.8142, lng: -39.034 },
        { lat: -14.8142004, lng: -39.0340003 },
      ),
      true,
    );
  });

  it('detects a CEP jump to another street', () => {
    assert.equal(
      sameLatLng(
        { lat: -14.8142, lng: -39.034 },
        { lat: -14.7884, lng: -39.0452 },
      ),
      false,
    );
  });
});
