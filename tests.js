/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
const assert = require('assert');
const { describe, it } = require('mocha');

const { slideChooser, buildSlideURL, getSlideIds } = require('./impl');
const corsicaGooglePresentation = require('.');

const corsicaDemoPresentationDeckID = '1_RWJt6XslTBeB04XjYJk71mM7DR49YKDVmZc5ZlWwUo';
const corsicaDemoSlideIDs = ['g7e85c7fed4_1_36', 'g715e31125c_0_0', 'g7134ada0df_0_0'];

describe('corsica expects things about this module', () => {
  it('should export as a function', () => {
    assert.strictEqual(typeof corsicaGooglePresentation, 'function');
  });
});

describe('the non-corsica business logic', () => {
  it('should choose a valid random index', () => {
    const values = [10, 20, 30, 40, 50];
    // random slides
    let chosenItem = 0;
    for (let i = 0; i < 10; i += 1) {
      chosenItem = slideChooser('random')(values);
      assert.ok(values.indexOf(chosenItem) >= 0);
      assert.ok(values.indexOf(chosenItem) < 5);
    }
  });

  it('should try to choose the numbered slide, but safely choose 0 if things get weird', () => {
    const values = [10, 20, 30, 40, 50];
    let chosenItem = 0;
    for (let i = 0; i < values.length; i += 1) {
      chosenItem = slideChooser(i)(values);
      assert.strictEqual(values.indexOf(chosenItem), i);
      assert.strictEqual(chosenItem, (i + 1) * 10);
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

  it('should build a valid url', () => {
    assert.strictEqual(
      buildSlideURL(corsicaDemoPresentationDeckID)(corsicaDemoSlideIDs[0]),
      'https://docs.google.com/presentation/d/1_RWJt6XslTBeB04XjYJk71mM7DR49YKDVmZc5ZlWwUo/embed#slide=id.g7e85c7fed4_1_36',
    );
  });

  it('should get the ID of each slide given a deckID', (done) => {
    getSlideIds(corsicaDemoPresentationDeckID)
      .then(function (slides) {
        const truthiness = [];
        slides.forEach((slide) => {
          truthiness.push(corsicaDemoSlideIDs.indexOf(slide) >= 0);
        });
        assert.ok(truthiness.every((t) => t));
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });
});
