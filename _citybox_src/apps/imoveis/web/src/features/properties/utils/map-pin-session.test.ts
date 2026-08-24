import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveDisplayedPin } from './map-pin-session';

const saved = { lat: -14.8142, lng: -39.034 };
const draft = { lat: -14.7884, lng: -39.0452 };

describe('resolveDisplayedPin', () => {
  it('keeps the saved point while the pin is locked', () => {
    assert.deepEqual(
      resolveDisplayedPin({ saved, editing: false, draft }),
      saved,
    );
  });

  it('shows the draft while editing', () => {
    assert.deepEqual(
      resolveDisplayedPin({ saved, editing: true, draft }),
      draft,
    );
  });

  it('falls back to saved if editing started without a draft', () => {
    assert.deepEqual(
      resolveDisplayedPin({ saved, editing: true, draft: null }),
      saved,
    );
  });
});
