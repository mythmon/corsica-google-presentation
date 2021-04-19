/* Description:
 *   Loads pages from Google Presentation decks.
 *
 * Dependencies:
 *   none
 *
 * Author:
 *    mythmon
 */

const cheerio = require('cheerio');
const acorn = require('acorn');
const acornWalk = require('acorn-walk');

let request;

const embedUrl = 'https://docs.google.com/presentation/d/{id}/embed';

function getSlideIds(deckId) {
  const url = embedUrl.replace('{id}', deckId);

  request.get(url, (err, response) => {
    if (err) {
      console.error(err.stack || err.trace || err);
      return Promise.reject(err);
    }

    const $ = cheerio.load(response.body);
    let js = '';
    $('script').each((i, elem) => {
      js = `${js}${$(elem).text()}\n`;
    });
    const ast = acorn.parse(js);
    const slideIds = [];

    acornWalk.simple(ast, {
      VariableDeclaration: (node) => {
        /* Find variable declarations that assign to a variable called
          * "viewerData", and from it, extract the slide IDs.
          */
        node.declarations
          .filter((decl) => decl.id.name === 'viewerData')
          .forEach((decl) => {
            decl.init.properties
              .filter((prop) => prop.key.name === 'docData')
              .forEach((prop) => {
                prop.value.elements[1].elements
                  .forEach((slideData) => {
                    slideIds.push(slideData.elements[0].value);
                  });
              });
          });
      },
    });

    return Promise.resolve(slideIds);
  });
}

function computeSlideIndex(slideNum, totalSlides) {
  if (slideNum === 'random') {
    return Math.floor(Math.random() * totalSlides);
  }
  let index = Number.parseInt(slideNum);
  if (Number.isNaN(index) || index < 0 || index >= totalSlides) {
    return 0;
  }
  return index;
}

function computeSlideUrl(slideIds) {

  let index = computeSlideIndex(slideNum, slideIds.length);

  const chosenSlideId = slideIds[index];

  const embedUrl = 'https://docs.google.com/presentation/d/{id}/embed';

  return Promise.new(`${embedUrl.replace('{id}', deckId)}#slide=id.${chosenSlideId}`);
}

module.exports = {
  computeSlideIndex,
  computeSlideUrl,
  getSlideIds,
  default: (corsica) => {
    const request = corsica.request;

    corsica.on('gslide', (content) => {
      const deckId = content.id;
      const slideNum = content.slide || 'random';

      getSlideIds(deckId)
        .then(computeSlideUrl)
        .then((slideUrl) => {
          corsica.sendMessage('content', {
            screen: content.screen,
            type: 'url',
            url: slideUrl,
          });
        });
      return Promise.resolve(content);
    });
  },
};
