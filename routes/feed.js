var express = require('express');
var router = express.Router();

var itemGenerator = require('../data/itemGenerator');

var moment = require('moment');

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
router.get('/:feed', function(req, res, next) {
  var changeNumber;
  if (req.query.afterChangeNumber === undefined && req.query.afterTimestamp === undefined) {
    changeNumber = moment().day(-14).unix();
  } else {
    changeNumber = parseInt(req.query.afterChangeNumber) || parseInt(req.query.afterTimestamp);
    if (isNaN(changeNumber)) {
      next(new Error("Invalid afterChangeNumber or afterTimestamp"));
    }
  }
  var afterId = req.query.afterId;
  let pageGenerationIntervalMinutes;
  let pageSize;
  if (req.params.feed == "session-series") {
    pageGenerationIntervalMinutes = 5;
    pageSize = 60;
  } else if (req.params.feed == "facility-uses") {
    pageGenerationIntervalMinutes = 5;
    pageSize = 60;
  } else if (req.params.feed == "slots") {
    pageGenerationIntervalMinutes = 5;
    pageSize = 2;
  } else {
    throw new Error("Invalid feed specified");
  }
  res.json(generateFeed(req.params.feed, pageGenerationIntervalMinutes, pageSize, changeNumber, afterId, itemGenerator.baseUrl(req), "/api/rpde/" + req.params.feed));
});

function createNextUrl(afterChangeNumber, baseUrl) {
  return baseUrl + '?afterChangeNumber=' + afterChangeNumber;
}

function createNextUrlWithModifiedId(afterTimestamp, afterId, baseUrl) {
  return baseUrl + '?afterTimestamp=' + afterTimestamp + "&afterId=" + afterId;
}

function generateFeed(feedType, pageGenerationIntervalMinutes, pageSize, lastChangeNumber, lastId, baseUrl, feedPath) {
  var tickList = [];
  if (lastChangeNumber > moment().unix()) {
    // Supplied lastChangeNumber is in the future, do nothing
    // (this also handles large inputs that break moment)
  } else {
    // Generate 24 items, starting from 1am, to midnight 
    var currentTimestamp = moment.unix(lastChangeNumber).roundNextMin(pageGenerationIntervalMinutes);
    for (var i = 0; i < pageSize; i++) {
      // Only create items that are not in the future
      if (currentTimestamp.diff(moment()) > 0) break;
      // Add interval minutes to generate each item
      currentTimestamp = currentTimestamp.add(pageGenerationIntervalMinutes, 'minutes');
      tickList.push( currentTimestamp.unix() );
    }
  }

  var items = tickList.map(tick => itemGenerator.generateItem(feedType, {modified: tick}, baseUrl)).reduce((acc, val) => acc.concat(val), []);
  return feedType == "slots" ? {
    "next": items.length > 0 ? createNextUrlWithModifiedId(items[items.length - 1].modified, items[items.length - 1].id, baseUrl + feedPath) : createNextUrlWithModifiedId(lastChangeNumber, lastId, baseUrl + feedPath),
    "items": items,
    "license": "https://creativecommons.org/licenses/by/4.0/"
  } : {
    "next": items.length > 0 ? createNextUrl(items[items.length - 1].modified, baseUrl + feedPath) : createNextUrl(lastChangeNumber, baseUrl + feedPath),
    "items": items,
    "license": "https://creativecommons.org/licenses/by/4.0/"
  };
}

module.exports = router;
