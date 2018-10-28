var express = require('express');
var router = express.Router();

var itemGenerator = require('../data/itemGenerator');

var moment = require('moment');

const PAGE_GENERATION_INTERVAL_MINUTES = 5;
const PAGE_SIZE = 60;

moment.fn.roundNextMin = function (min) {
  if (60 % min != 0) throw "60 must be divisible by input: " + min; 
  var intervals = Math.floor(this.minutes() / min);
  intervals++;
  if(intervals == 60/min) {
    this.add('hours', 1);
    intervals = 0;
  }
  this.minutes(intervals * min);
  this.seconds(0);
  this.milliseconds(0);
  return this;
}

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
    if (isNaN(changeNumber)) {
      next(new Error("Invalid afterChangeNumber"));
    }
  }
  res.json(generateFeed(changeNumber, itemGenerator.baseUrl(req), "/api/rpde/session-series"));
});

function createNextUrl(afterChangeNumber, baseUrl) {
  return baseUrl + '?afterChangeNumber=' + afterChangeNumber;
}

function generateFeed(lastChangeNumber, baseUrl, feedPath) {
  var tickList = [];
  if (lastChangeNumber > moment().unix()) {
    // Supplied lastChangeNumber is in the future, do nothing
    // (this also handles large inputs that break moment)
  } else {
    // Generate 24 items, starting from 1am, to midnight 
    var currentTimestamp = moment.unix(lastChangeNumber).roundNextMin(PAGE_GENERATION_INTERVAL_MINUTES);
    for (var i = 0; i < PAGE_SIZE; i++) {
      // Only create items that are not in the future
      if (currentTimestamp.diff(moment()) > 0) break;
      // Add interval minutes to generate each item
      currentTimestamp = currentTimestamp.add(PAGE_GENERATION_INTERVAL_MINUTES, 'minutes')
      tickList.push(currentTimestamp.unix());
    }
  }

  var items = tickList.map(tick => itemGenerator.generateItem({modified: tick}, baseUrl));
  return {
    "next": items.length > 0 ? createNextUrl(items[items.length - 1].modified, baseUrl + feedPath) : createNextUrl(lastChangeNumber, baseUrl + feedPath),
    "items": items,
    "license": "https://creativecommons.org/licenses/by/4.0/"
  }
}

module.exports = router;
