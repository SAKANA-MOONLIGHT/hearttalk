require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const values = new Map();
const key = '@hearttalk/state/v1';
let fail = false;
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === '@react-native-async-storage/async-storage') return {
    getItem: async (name) => values.get(name) ?? null,
    setItem: async (name, value) => {
      await new Promise((resolve) => setTimeout(resolve, 2));
      if (fail) throw new Error('Disk full');
      values.set(name, value);
    },
    removeItem: async (name) => { values.delete(name); },
  };
  return originalLoad.call(this, request, ...args);
};
const { DEFAULT_STATE, loadState, saveState, resetState } = require('../lib/storage.ts');
Module._load = originalLoad;

test('existing v1 progress survives and new defaults migrate without changing IDs', async () => {
  values.set(key, JSON.stringify({ startDate: '2026-10-01', used: [0, 31], history: [{ id: 31, date: '2026-10-21' }], favs: [31], lastTopicId: 31 }));
  const state = await loadState();
  assert.deepEqual(state.used, [0, 31]); assert.deepEqual(state.favs, [31]);
  assert.equal(state.selectedMonth, null); assert.equal(state.startDate, '2026-10-01');
});

test('rapid writes and reset are ordered; language preference survives reset', async () => {
  values.set('@hearttalk/language/v1', 'ja');
  await Promise.all([
    saveState({ ...DEFAULT_STATE, used: [1] }),
    saveState({ ...DEFAULT_STATE, used: [1, 2] }),
    resetState(),
  ]);
  assert.equal(values.has(key), false);
  assert.equal(values.get('@hearttalk/language/v1'), 'ja');
});

test('save failure reaches the UI and the next write can recover', async () => {
  fail = true;
  await assert.rejects(saveState(DEFAULT_STATE), /Disk full/);
  fail = false;
  await saveState({ ...DEFAULT_STATE, favs: [31] });
  assert.deepEqual((await loadState()).favs, [31]);
});
