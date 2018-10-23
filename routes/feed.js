var express = require('express');
var router = express.Router();

var itemGenerator = require('../data/itemGenerator');

var moment = require('moment');

router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  var changeNumber;
  if (req.query.afterChangeNumber === undefined) {
    changeNumber = moment().day(-14).unix();
  } else {
    changeNumber = parseInt(req.query.afterChangeNumber);
    if (isNaN(changeNumber) || roundToNearestHour(moment.unix(changeNumber)).add(1, 'hours').unix() == null) {
      next(new Error("Invalid afterChangeNumber"));
    }
  }
  res.json(generateFeed(changeNumber, itemGenerator.baseUrl(req), "/api/rpde/sessions"));
});

function createNextUrl(afterChangeNumber, baseUrl) {
  return baseUrl + '?afterChangeNumber=' + afterChangeNumber;
}

function roundToNearestHour(m) {
  return m.minute() || m.second() || m.millisecond() ? m.add(1, 'hour').startOf('hour') : m.startOf('hour');
}

function generateFeed(lastChangeNumber, baseUrl, feedPath) {
  //Generate 24 items, starting from 1am, to midnight 
  var tickList = [];
  var currentTimestamp = roundToNearestHour(moment.unix(lastChangeNumber));
  for (var i = 0; i < 240; i++) {
    // Only create items that are not in the future
    if (currentTimestamp.diff(moment()) > 0) break;
    // Add 1 hour intervals to cover each day
    currentTimestamp = currentTimestamp.add(1, 'hours')
    tickList.push(currentTimestamp.unix());
  }

  var items = tickList.map(tick => itemGenerator.generateItem({modified: tick}, baseUrl));
  return {
    "next": items.length > 0 ? createNextUrl(items[items.length - 1].modified, baseUrl + feedPath) : createNextUrl(lastChangeNumber, baseUrl + feedPath),
    "items": items,
    "license": "https://creativecommons.org/licenses/by/4.0/"
  }
}

module.exports = router;
