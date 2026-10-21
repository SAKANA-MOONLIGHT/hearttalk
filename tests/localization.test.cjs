require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { ALL_TOPICS, STAGES, TOTAL_DAYS, monthForDay } = require('../lib/topics.ts');
const { content, localizedTopic, localizedHint, localizedStage } = require('../lib/i18n/content.ts');
const { languages, messages, resolveLocale, translate, formatDate } = require('../lib/i18n/strings.ts');

test('every language has all 366 questions, 12 stages and all 48 starters in the original order', () => {
  assert.equal(TOTAL_DAYS, 366);
  for (const { code } of languages) {
    assert.equal(content[code].length, 12);
    const questions = [];
    content[code].forEach((stage, index) => {
      assert.ok(stage.name.trim()); assert.ok(stage.subtitle.trim());
      assert.equal(stage.topics.length, STAGES[index].topics.length, `${code}: month ${index + 1}`);
      assert.equal(stage.hints.length, STAGES[index].hints.length);
      for (const text of [...stage.topics, ...stage.hints]) assert.ok(text.trim().length > 5);
      questions.push(...stage.topics);
    });
    assert.equal(questions.length, 366);
    assert.equal(new Set(questions).size, 366, `${code}: duplicated translation`);
    if (code !== 'zh') questions.forEach((text) => assert.ok(!STAGES.some((s) => s.topics.includes(text))));
  }
});

test('language switches keep topic identity and hint assignment, including saved and historical questions', () => {
  for (const topic of ALL_TOPICS) {
    for (const { code } of languages) {
      const stage = localizedStage(topic.month, code);
      assert.equal(localizedTopic(topic, code), stage.topics[topic.indexInMonth - 1]);
      assert.equal(localizedHint(topic, code), stage.hints[topic.id % stage.hints.length]);
      assert.equal(stage.accent, STAGES[topic.month - 1].accent);
    }
  }
  assert.equal(monthForDay(32), 2);
  assert.equal(monthForDay(366), 12);
});

test('all UI messages have the same placeholders and resolve in all four languages', () => {
  for (const { code } of languages) {
    assert.deepEqual(Object.keys(messages[code]).sort(), Object.keys(messages.zh).sort());
    for (const key of Object.keys(messages.zh)) {
      const placeholders = (s) => (s.match(/\{\w+\}/g) ?? []).sort();
      assert.deepEqual(placeholders(messages[code][key]), placeholders(messages.zh[key]), `${code}: ${key}`);
      assert.ok(!translate(code, key, { n: 12, name: 'test', date: '2026-10-21' }).includes('{'));
    }
  }
});

test('locale matching handles regions and unsupported devices predictably', () => {
  for (const [tag, expected] of [['zh-Hans-CN', 'zh'], ['en_GB', 'en'], ['ja-JP', 'ja'], ['ko-KR', 'ko'], ['fr-FR', 'en'], [null, 'en']]) {
    assert.equal(resolveLocale(tag), expected);
  }
  for (const { code } of languages) assert.ok(formatDate('2026-10-21', code).includes('21'));
});
