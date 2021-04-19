const assert = require('assert');
const { describe, it } = require('mocha');

const { slideChooser, buildSlideURL, getSlideIds } = require('.');
const corsicaDemoPresentationDeckID = '1_RWJt6XslTBeB04XjYJk71mM7DR49YKDVmZc5ZlWwUo';

describe('the non-corsica business logic', () => {
  it('should choose a valid random index', () => {
    let values = [10,20,30,40,50];
    // random slides
    for (let i = 0; i < 10; i++) {
        chosenItem = slideChooser('random')(values);
        assert.ok(values.indexOf(chosenItem) >= 0);
        assert.ok(values.indexOf(chosenItem) < 5);
    }
  });
});