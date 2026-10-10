/**
 *   npx tsx src/lib/campaign-brief-draft.test.ts
 */

import assert from 'node:assert/strict';

import {
  BRIEF_DRAFT_STORAGE_KEY,
  BRIEF_DRAFT_TTL_MS,
  BRIEF_DRAFT_VERSION,
  BRIEF_STEP_QUERY_KEY,
  buildStepUrl,
  clampBriefStep,
  clearBriefDraft,
  createInitialBriefValues,
  isBriefStepComplete,
  loadBriefDraft,
  normalizeBriefValues,
  parseStepParam,
  saveBriefDraft,
  type CampaignBriefFormValues,
} from './campaign-brief-draft';

function withSessionStorage(run: () => void) {
  const store = new Map<string, string>();
  const original = globalThis.sessionStorage;
  const mock: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: mock,
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: globalThis,
  });
  try {
    run();
  } finally {
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: original,
    });
  }
}

function filledContact(partial: Partial<CampaignBriefFormValues> = {}): CampaignBriefFormValues {
  return {
    ...createInitialBriefValues(),
    contact_name_first: 'Ada',
    contact_name_last: 'Lovelace',
    company_name: 'Analytical',
    contact_email: 'ada@example.com',
    ...partial,
  };
}

function filledThroughStep2(
  partial: Partial<CampaignBriefFormValues> = {},
): CampaignBriefFormValues {
  return filledContact({
    campaign_title: 'Spring',
    campaign_type: 'Product Campaign',
    budget_range: 'Under $75K',
    ...partial,
  });
}

function testParseStepParam() {
  assert.equal(parseStepParam('1'), 1);
  assert.equal(parseStepParam('3'), 3);
  assert.equal(parseStepParam('0'), null);
  assert.equal(parseStepParam('4'), null);
  assert.equal(parseStepParam('abc'), null);
  assert.equal(parseStepParam(null), null);
  assert.equal(parseStepParam(''), null);
}

function testBuildStepUrlPreservesOtherKeys() {
  const url = buildStepUrl('/video-campaign-brief', '?utm=1&step=1', 2);
  assert.equal(url, `/video-campaign-brief?utm=1&${BRIEF_STEP_QUERY_KEY}=2`);

  const bare = buildStepUrl('/zh/视频活动简介', '', 3);
  assert.equal(bare, `/zh/视频活动简介?${BRIEF_STEP_QUERY_KEY}=3`);
}

function testClampBriefStep() {
  const empty = createInitialBriefValues();
  assert.equal(clampBriefStep(3, empty), 1);
  assert.equal(clampBriefStep(2, empty), 1);

  const contactOnly = filledContact();
  assert.equal(clampBriefStep(3, contactOnly), 2);
  assert.equal(clampBriefStep(2, contactOnly), 2);
  assert.equal(clampBriefStep(1, contactOnly), 1);

  const ready = filledThroughStep2();
  assert.equal(clampBriefStep(3, ready), 3);
  assert.equal(isBriefStepComplete(ready, 1), true);
  assert.equal(isBriefStepComplete(ready, 2), true);
}

function testClampRejectsInvalidEmail() {
  const badEmail = filledContact({contact_email: 'not-an-email'});
  assert.equal(isBriefStepComplete(badEmail, 1), false);
  assert.equal(clampBriefStep(2, badEmail), 1);
}

function testNormalizeBriefValues() {
  const normalized = normalizeBriefValues({
    contact_name_first: 'A',
    extra_deliverables: ['Still photos', 12, 'Other'],
    delivery_deadline_unknown: true,
    bogus: 'x',
  });
  assert.equal(normalized.contact_name_first, 'A');
  assert.deepEqual(normalized.extra_deliverables, ['Still photos', 'Other']);
  assert.equal(normalized.delivery_deadline_unknown, true);
  assert.equal(normalized.company_name, '');
}

function testDraftSaveLoadClear() {
  withSessionStorage(() => {
    const values = filledThroughStep2({additional_notes: 'hello'});
    saveBriefDraft(3, values);
    const loaded = loadBriefDraft();
    assert.ok(loaded);
    assert.equal(loaded!.v, BRIEF_DRAFT_VERSION);
    assert.equal(loaded!.step, 3);
    assert.equal(loaded!.values.additional_notes, 'hello');
    assert.equal(loaded!.values.contact_email, 'ada@example.com');

    clearBriefDraft();
    assert.equal(loadBriefDraft(), null);
    assert.equal(sessionStorage.getItem(BRIEF_DRAFT_STORAGE_KEY), null);
  });
}

function testDraftTtlExpiry() {
  withSessionStorage(() => {
    const values = filledContact();
    sessionStorage.setItem(
      BRIEF_DRAFT_STORAGE_KEY,
      JSON.stringify({
        v: BRIEF_DRAFT_VERSION,
        at: Date.now() - BRIEF_DRAFT_TTL_MS - 1,
        step: 2,
        values,
      }),
    );
    assert.equal(loadBriefDraft(), null);
    assert.equal(sessionStorage.getItem(BRIEF_DRAFT_STORAGE_KEY), null);
  });
}

function testDraftClampsStoredStep() {
  withSessionStorage(() => {
    saveBriefDraft(3, filledContact());
    const loaded = loadBriefDraft();
    assert.ok(loaded);
    assert.equal(loaded!.step, 2);
  });
}

testParseStepParam();
testBuildStepUrlPreservesOtherKeys();
testClampBriefStep();
testClampRejectsInvalidEmail();
testNormalizeBriefValues();
testDraftSaveLoadClear();
testDraftTtlExpiry();
testDraftClampsStoredStep();

console.log('campaign-brief-draft.test.ts: ok');
