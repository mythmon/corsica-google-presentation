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

let embedUrl = 'https://docs.google.com/presentation/d/{id}/embed';

function getSlideIds(deckId) {
  let url = embedUrl.replace('{id}', deckId);

  return new Promise((resolve, reject) => {
    request.get(url, (err, response) => {
      if (err) {
        console.error(err.stack || err.trace || err);
        reject(err);
        return;
      }

      let $ = cheerio.load(response.body);
      let js = '';
      $('script').each((i, elem) => {
        js += $(elem).text() + '\n';
      });
      let ast = acorn.parse(js);
      let slideIds = [];

      acornWalk.simple(ast, {
        VariableDeclaration: (node) => {
          /* Find variable declarations that assign to a variable called
           * "viewerData", and from it, extract the slide IDs.
           */
          node.declarations
            .filter((decl) => { return decl.id.name === 'viewerData'; })
            .forEach((decl) => {
              decl.init.properties
                .filter((prop) => { return prop.key.name === 'docData'; })
                .forEach((prop) => {
                  prop.value.elements[1].elements
                    .forEach((slideData) => {
                      slideIds.push(slideData.elements[0].value);
                    });
                });
            });
        },
      });

      resolve(slideIds);
    });
  });
}

module.exports = {
  getSlideIds,
  default: (corsica) => {
    request = corsica.request;

    corsica.on('gslide', (content) => {
      let deckId = content.id;
      let slideNum = content.slide || 'random';

      getSlideIds(deckId)
        .then((slideIds) => {
          let index;
          if (slideNum === 'random') {
            index = Math.floor(Math.random() * slideIds.length);
          } else {
            index = parseInt(slideNum);
            if (isNaN(index) || index < 0 || index >= slideIds.length) {
              index = 0;
            }
          }
          console.log('[glide] showing index', index);
          let chosenSlideId = slideIds[index];

          corsica.sendMessage('content', {
            screen: content.screen,
            type: 'url',
            url: embedUrl.replace('{id}', deckId) + '#slide=id.' + chosenSlideId,
          });
        });
      return content;
    });
  },
};
