/* Description:
 *   Loads pages from Google Presentation decks.
 *
 * Dependencies:
 *   none
 *
 * Author:
 *    mythmon
 */

var Promise = require('es6-promises');
var cheerio = require('cheerio');
var acorn = require('acorn');
var acornWalk = require('acorn/util/walk');
var request;

var embedUrl = 'https://docs.google.com/presentation/d/{id}/embed';

module.exports = function(corsica) {
  request = corsica.request;

  corsica.on('gslide', function(content) {
    var deckId = content.id;
    var slideNum = content.slide || 'random';

    getSlideIds(deckId)
    .then(function(slideIds) {
      var index;
      if (slideNum === 'random') {
        index = Math.floor(Math.random() * slideIds.length);
      } else {
        index = parseInt(slideNum);
        if (isNaN(index) || index < 0 || index >= slideIds.length) {
          index = 0;
        }
      }
      console.log('[glide] showing index', index)
      var chosenSlideId = slideIds[index];

      corsica.sendMessage('content', {
        screen: content.screen,
        type: 'url',
        url: embedUrl.replace('{id}', deckId) + '#slide=id.' + chosenSlideId,
      });
    })
    return content;
  });
}

function getSlideIds(deckId) {
  var url = embedUrl.replace('{id}', deckId);

  return new Promise(function(resolve, reject) {
    request.get(url, function(err, response) {
      if (err) {
        console.error(err.stack || err.trace || err);
        reject(err);
        return;
      }

      var $ = cheerio.load(response.body);
      var js = '';
      $('script').each(function(i, elem) {
        js += $(elem).text() + '\n';
      });
      var ast = acorn.parse(js);
      var slideIds = [];

      acornWalk.simple(ast, {
        VariableDeclaration: function(node) {
          /* Find variable declarations that assign to a variable called
           * "viewerData", and from it, extract the slide IDs.
           */
          node.declarations
          .filter(function(decl) { return decl.id.name === 'viewerData'; })
          .forEach(function(decl) {
            decl.init.properties
            .filter(function(prop) { return prop.key.name === 'docData'; })
            .forEach(function(prop) {
              prop.value.elements[1].elements
              .forEach(function(slideData) {
                slideIds.push(slideData.elements[0].value);
              });
            });
          });

        },
      });

      resolve(slideIds);
    });
  })
}
