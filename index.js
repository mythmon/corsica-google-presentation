/* Description:
 *   Loads pages from Google Presentation decks.
 *
 * Dependencies:
 *   none
 *
 * Author:
 *    mythmon
 */

const { buildSlideURL, getSlideIds, slideChooser } = require('./impl.js');

module.exports = (corsica) => {
  corsica.on('gslide', (content) => {
    const deck = content.id;
    const slideNum = content.slide || 'random';

    getSlideIds(deck)
      .then(slideChooser(slideNum))
      .then(buildSlideURL)
      .then((slideUrl) => {
        corsica.sendMessage('content', {
          screen: content.screen,
          type: 'url',
          url: slideUrl,
        });
      });
    return Promise.resolve(content);
  });
};
