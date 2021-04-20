const assert = require('assert');
const { describe, it } = require('mocha');

const { slideChooser, buildSlideURL, getSlideIds } = require('.');

const corsicaDemoPresentationDeckID = '1_RWJt6XslTBeB04XjYJk71mM7DR49YKDVmZc5ZlWwUo';

describe('the non-corsica business logic', () => {
  it('should choose a valid random index', () => {
    let values = [10, 20, 30, 40, 50];
    // random slides
    for (let i = 0; i < 10; i++) {
      chosenItem = slideChooser('random')(values);
      assert.ok(values.indexOf(chosenItem) >= 0);
      assert.ok(values.indexOf(chosenItem) < 5);
    }
  });

  it('should try to choose the numbered slide, but safely choose 0 if things get weird', () => {
    let values = [10, 20, 30, 40, 50];

    for (let i = 0; i < values.length; i++) {
      chosenItem = slideChooser(i)(values);
      assert.strictEqual(values.indexOf(chosenItem), i);
      assert.strictEqual(chosenItem, i*10);
    }

    // out of bounds is undefined
    chosenItem = slideChooser(100)(values);
    assert.strictEqual(values.indexOf(chosenItem), -1);
    assert.strictEqual(chosenItem, undefined);

    // text other than random is the first item
    chosenItem = slideChooser('gibberish')(values);
    assert.strictEqual(values.indexOf(chosenItem), 0);
    assert.strictEqual(chosenItem, 10);
  });
});
