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

/**
 * returns a function that returns a single element from an array. the strategy
 * for choosing that function may be the string 'random' or an integer indicating
 * the array position to choose. If the strategy is unexpected or negative it
 * will try to pull the first item. If the array is too small the func will
 * return undefined.
 *
 * @param {String|Integer} strategy either 'random' or a positive integer
 * @returns {Function(String):String} return a function that selects a single
 * element from an array-like object
 */
 function slideChooser(strategy) {
  if (strategy === 'random') {
    return (arr) => { arr[Math.floor(Math.random() * arr.length)] };
  }
  let index = Number.parseInt(slideNum);
  if (Number.isNaN(index) || index < 0) {
    index = 0;
  }
  return (arr) => { arr[index] };
}

module.exports = {
  default: (corsica) => {
    const request = corsica.request;

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
  },
};
