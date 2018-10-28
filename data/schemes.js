var request = require('sync-request');
var skos = require('@openactive/skos');

var schemes = {
  "activity-list": augmentWithSampleConcepts(getScheme("https://www.openactive.io/activity-list/activity-list.jsonld")),
  "accessibility-support": getScheme("https://www.openactive.io/accessibility-support/accessibility-support.jsonld"),
  "special-requirements": getScheme("http://data.emduk.org/special-requirements/special-requirements.jsonld")
}

function augmentWithSampleConcepts(scheme) {
  var conceptScheme = new skos.ConceptScheme(scheme);
  var concept = conceptScheme.getConceptByLabel('Water-Based Classes');
  scheme.sample = [concept].concat(concept.getNarrowerTransitive()).map(concept => concept.getJSON());
  return scheme;
}

function getScheme(schemeUrl) {
  console.log("Downloading: " + schemeUrl);
  var response = request('GET', schemeUrl, { headers: { accept: 'application/ld+json' } });
  if (response && response.statusCode == 200) {
    var body = JSON.parse(response.getBody('utf8'));
    return body["concept"] && body["id"] && body["type"] === "ConceptScheme" ? body : undefined;
  } else {
    throw "Invalid scheme specified: " + schemeUrl;
  }
}

module.exports = schemes;