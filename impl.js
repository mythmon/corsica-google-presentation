const cheerio = require('cheerio');
const acorn = require('acorn');
const acornWalk = require('acorn-walk');
const fetch = require('node-fetch');

const embedUrl = 'https://docs.google.com/presentation/d/{id}/embed';

function getSlideIds(deckId) {
  const url = embedUrl.replace('{id}', deckId);

  return fetch(url)
    .then((response) => response.text())
    .then((body) => {
      const $ = cheerio.load(body);
      const slideIds = [];
      $('script').each((i, elem) => {
        if (!elem
          || !elem.children
          || elem.children.length < 1
          || !elem.children[0].data) {
          // || elem.children[0].data.indexOf('docData') === -1) {
          return;
        }
        acornWalk.simple(acorn.parse(elem.children[0].data, { ecmaVersion: 2020 }),
          {
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
      });
      return slideIds;
    })
    .catch((err) => {
      console.error(err.stack || err.trace || err);
      return Promise.reject(err);
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
    return (arr) => arr[Math.floor(Math.random() * arr.length)];
  }
  let index = Number.parseInt(strategy);
  if (Number.isNaN(index) || index < 0) {
    index = 0;
  }
  return (arr) => arr[index];
}

/**
 * This provides a way build the context necessary to get a slide URL. We need
 * both the deck, which is known early, and the slide id, which is determined in
 * the process chain.
 *
 * @param {String} deckID the ID of the google presentation deck
 * @returns {Function(String):String} return a function that takes the slideID
 * and returns the full URL for that deck and slide combination
 */
function buildSlideURL(deckID) {
  return (slideID) => `${embedUrl.replace('{id}', deckID)}#slide=id.${slideID}`;
}

module.exports = {
  buildSlideURL,
  getSlideIds,
  slideChooser,
};
