const assert = require('assert');
const { describe, it } = require('mocha');

const { computeSlideIndex, computeSlideUrl, getSlideIds } = require('.');
const corsicaDemoPresentationDeckID = '1_RWJt6XslTBeB04XjYJk71mM7DR49YKDVmZc5ZlWwUo';

describe('the non-corsica business logic', () => {
  it('should choose a valid random index', () => {
    let chosenIndex = -1;
    // random slides
    for (let i = 0; i < 10; i++) {
        chosenIndex = computeSlideIndex('random', 10);
        assert.ok(chosenIndex >= 0);
        assert.ok(chosenIndex < 10);
        assert.ok(Number.isInteger(chosenIndex));
    }
  });
  it('should try to choose the numbered slide, but safely choose 0 if things get weird', () => {
    for (let i = 0; i < 10; i++) {
      chosenIndex = computeSlideIndex(i, 10);
      assert.ok(chosenIndex == i);
    }

    // out of bounds
    chosenIndex = computeSlideIndex(11, 10);
    assert.ok(chosenIndex == 0);

    // text other than random
    chosenIndex = computeSlideIndex('five', 10);
    assert.ok(chosenIndex == 0);
  });
});