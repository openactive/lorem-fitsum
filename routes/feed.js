var express = require('express');
var moment = require('moment');
var itemGenerator = require('../data/itemGenerator');
var env = require('../env');

var router = express.Router();

/**
 * Round a date to the next interval (e.g. to the next hour)
 *
 * @param {number} intervalMinutes
 * @param {import('moment').Moment} momentDate
 */
function roundNextMin(intervalMinutes, momentDate) {
  const newMomentDate = moment(momentDate);
  if (60 % intervalMinutes !== 0) throw new Error('`intervalMinutes` must be a factor of 60. Value: "' + intervalMinutes + '"');
  var intervals = Math.floor(newMomentDate.minutes() / intervalMinutes);
  intervals++;
  if(intervals == 60/intervalMinutes) {
    newMomentDate.add(1, 'hours');
    intervals = 0;
  }
  newMomentDate.minutes(intervals * intervalMinutes);
  newMomentDate.seconds(0);
  newMomentDate.milliseconds(0);
  return newMomentDate;
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
    changeNumber = moment().add(env.TIMESTAMP_START_DAY_OFFSET, 'days').unix();
  } else {
    changeNumber = parseInt(req.query.afterChangeNumber) || parseInt(req.query.afterTimestamp);
    if (isNaN(changeNumber)) {
      return next(new Error("Invalid afterChangeNumber or afterTimestamp"));
    }
  }
  var afterId = req.query.afterId;
  let pageGenerationIntervalMinutes;
  let pageSize;
  if (req.params.feed == "session-series") {
    pageGenerationIntervalMinutes = env.FEED_SESSIONSERIES_TIMESTAMP_INVERVAL_MINUTES;
    pageSize = env.FEED_SESSIONSERIES_PAGE_SIZE;
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

/**
 * @param {'session-series' | 'facility-uses' | 'slots'} feedType
 * @param {number} pageGenerationIntervalMinutes 
 * @param {number} pageSize 
 * @param {number} lastChangeNumber 
 * @param {string} [lastId]
 * @param {string} baseUrl 
 * @param {string} feedPath 
 */
function generateFeed(feedType, pageGenerationIntervalMinutes, pageSize, lastChangeNumber, lastId, baseUrl, feedPath) {
  var tickList = [];
  if (lastChangeNumber > moment().unix()) {
    // Supplied lastChangeNumber is in the future, do nothing
    // (this also handles large inputs that break moment)
  } else {
    // Generate 24 items, starting from 1am, to midnight 
    var currentTimestamp = roundNextMin(pageGenerationIntervalMinutes, moment.unix(lastChangeNumber));
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
