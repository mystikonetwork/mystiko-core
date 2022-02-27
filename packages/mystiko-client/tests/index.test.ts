/**
 * @jest-environment jsdom
 */
import mystiko from '../src/index';
import browserMystiko from '../src/browser';

test('test mystiko', () => {
  expect(mystiko).toStrictEqual(browserMystiko);
});
