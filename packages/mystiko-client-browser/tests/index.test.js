import '../src/index.js';

test('test window is set', () => {
  expect(window.mystiko).not.toBe(undefined);
});
