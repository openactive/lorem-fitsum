var faker = require('faker');
var moment = require('moment-timezone');
var RRule = require('rrule').RRule;
var RRuleSet = require('rrule').RRuleSet;
var env = require('../env');
var postcodes = require('./postcodes');
var schemes = require('./schemes');

const EVENT_ATTENDANCE_MODES = {
  MIXED: 'https://schema.org/MixedEventAttendanceMode',
  OFFLINE: 'https://schema.org/OfflineEventAttendanceMode',
  ONLINE: 'https://schema.org/OnlineEventAttendanceMode',
};

function generateImageUrl(w, h, seed) {
  return `https://picsum.photos/${w}/${h}?image=${seed}`;
}

function generateAttendeeInstructions(golden) {
  var clothingInstructions = "Clothing instructions: " + getRandomElementsOf([
    "wear sportswear/gym clothes",
    "wear comfortable loose clothing",
    "come as you are",
    "bring trainers",
    "wear flat shoes",
    "no footwear required"
  ], golden, 1).join(", ") + ".";

  var equipment = "Equipment you need to bring: " + getRandomElementsOf([
    "a water bottle",
    "a sweat towel",
    "hand weights",
    "an exercise mat",
    "boxing gloves",
    "a skipping rope",
    "a stretch band",
    "a locker padlock",
    "parking/locker money"
  ], golden, 1).join(", ") + ".";
  
  return golden || faker.random.boolean() ? clothingInstructions + "\n\n" + equipment : (faker.random.boolean() ? equipment : null );
}

//Age ranges used to generate offers
const ageRanges = {
  "Adult": {
    "type": "QuantitativeValue",
    "minValue": 18,
    "maxValue": 60
  },
  "Adult (Off-peak)": {
    "type": "QuantitativeValue",
    "minValue": 18,
    "maxValue": 60
  },
  "Junior": {
    "type": "QuantitativeValue",
    "maxValue": 18
  },
  "Junior (Off-peak)": {
    "type": "QuantitativeValue",
    "maxValue": 18
  },
  "Senior": {
    "type": "QuantitativeValue",
    "minValue": 60
  }
};

function generateOffers(baseUrl, modified, golden, isAccessibleForFree) {
  const FREE_ENTRY = "FREE";
  return getRandomElementsOf(Object.keys(ageRanges), golden, 1).concat(isAccessibleForFree ? [ FREE_ENTRY ] : []).map(age => generateOffer(age, baseUrl, modified, golden, age == FREE_ENTRY));
}

function generateBrand(golden) {
  return {
    "type": "Brand",
    "name": faker.random.arrayElement(["Keyways Active", "This Girl Can", "Back to Activity", "Mega-active Super Dads"]), 
    "url": faker.internet.url(),
    "description": faker.lorem.paragraphs(golden ? 4 : faker.random.number(4)),
    "logo": {
      "type": "ImageObject",
      "url": faker.image.avatar()
    },
    "beta:video": [
      {
        "type": "VideoObject",
        "url": "https://www.youtube.com/watch?v=N268gBOvnzo"
      }
    ]
  };
}

function generateOffer(age, baseUrl, modified, golden, free) {
  if (free) {
    return {
      "type": "Offer",
      "name": "Free Entry",
      "price": 0,
      "url": baseUrl + "/listings/" + modified + "#booking-" + age.toLowerCase()
    };
  } else {
    return {
      "type": "Offer",
      "name": age,
      "price": faker.random.number(3000)/100,
      "priceCurrency": "GBP",
      "eligibleCustomerType": getRandomElementsOf([
        "https://openactive.io/ns-beta#Member"
      ], golden),
      "ageRange": ageRanges[age],
      "beta:availableChannel": getRandomElementsOf([
        "https://openactive.io/ns-beta#OnlinePrepayment",
        "https://openactive.io/ns-beta#TelephonePrepayment",
      ], golden),
      "acceptedPaymentMethod": getRandomElementsOf([
        "http://purl.org/goodrelations/v1#Cash",
        "http://purl.org/goodrelations/v1#PaymentMethodCreditCard"
      ], golden),
      "url": baseUrl + "/listings/" + modified + "#booking-" + age.toLowerCase()
    };
  }
}

function generateImages(golden) {
  var out = [];
  var imageCount = faker.random.number(golden ? {min: 4, max: 6} : { max: 6 });
  for (var i = 0; i < imageCount; i++) {
    var imageSeed = faker.random.number(1083);
    out.push({
      "type": "ImageObject",
      "url": generateImageUrl(1024, 768, imageSeed),
      "thumbnail": getRandomElementsOf([
        {
          "type": "ImageObject",
          "url": generateImageUrl(672, 414, imageSeed),
          "height": "414 px",
          "width": "672 px"
        },
        {
          "type": "ImageObject",
          "url": generateImageUrl(300, 200, imageSeed),
          "height": "200 px",
          "width": "300 px"
        },
        {
          "type": "ImageObject",
          "url": generateImageUrl(100, 100, imageSeed),
          "height": "100 px",
          "width": "100 px"
        }
      ], golden),
    });
  }
  return out;
}

function generateAgeRange(golden) {
  var maxAgeCeiling = faker.random.number(80);
  var maxAge = golden || faker.random.boolean() ? maxAgeCeiling : null;
  var minAge = golden || faker.random.boolean() ? faker.random.number(maxAge || 60) : null;
  if (maxAge == null && minAge == null) minAge = 0;
  var output = {
    "type": "QuantitativeValue"
  };
  if (minAge != null) output.minValue = minAge;
  if (maxAge != null) output.maxValue = maxAge;
  return output;
}

function generateAmenityFeature(golden) {
  var amenityFeature = [
    {
      "name": "Changing Facilities",
      "value": faker.random.boolean(),
      "type": "ChangingFacilities"
    },
    {
      "name": "Showers",
      "value": faker.random.boolean(),
      "type": "Showers"
    },
    {
      "name": "Lockers",
      "value": faker.random.boolean(),
      "type": "Lockers"
    },
    {
      "name": "Towels",
      "value": faker.random.boolean(),
      "type": "Towels"
    },
    {
      "name": "Creche",
      "value": faker.random.boolean(),
      "type": "Creche"
    },
    {
      "name": "Parking",
      "value": faker.random.boolean(),
      "type": "Parking"
    }
  ];
  return getRandomElementsOf(amenityFeature, golden);
}

function getRandomElementsOf(array, golden, minimum = 0) {
  return golden ? array : faker.helpers.shuffle(array).slice(faker.random.number(array.length - minimum));
}

function generateArrayOf(generateFunction, baseUrl, modified, golden, range) {
  var output = [];
  var maxCount = golden ? range.max : faker.random.number(range);
  for (var i = 0; i < maxCount; i++) {
    output.push(generateFunction(baseUrl, modified, golden));
  }
  return output;
}

/**
 * @param {number} modified
 * @param {string} baseUrl
 * @param {boolean} golden
 */
function generateSchedule(modified, baseUrl, golden) {
  var startTime = moment({hour: faker.random.number({min: 6, max: 22}), minute: faker.random.arrayElement([0, 15, 30, 45])});
  var duration = faker.random.arrayElement(["PT30M", "PT1H", "PT1H30M", "PT2H"]);
  var endTime = startTime.clone().add(moment.duration(duration));
  var schedule = {
    "type": "Schedule",
    "startDate": moment.unix(modified).add(env.SCHEDULE_START_DAY_OFFSET, 'days').utc().format('YYYY-MM-DD'),
    "endDate": moment.unix(modified)
      .add(faker.random.number({min: env.SCHEDULE_MIN_END_DAY_OFFSET, max: env.SCHEDULE_MAX_END_DAY_OFFSET}), 'days')
      .utc().format('YYYY-MM-DD'),
    "repeatFrequency": faker.random.arrayElement(["P1W", "P2W"]),
    "byDay": getRandomElementsOf(Object.keys(byDayMap), false, 1),
    "startTime": startTime.format("hh:mm"),
    "endTime": endTime.format("hh:mm"),
    "duration": duration,
    "scheduledEventType": "ScheduledSession",
    "beta:timeZone": "Europe/London"
  };
  // Ensure start and end dates for this schedule match the actual schedule 
  var occurrences = generateDatesFromSchedule([schedule], modified);
  schedule.startDate = moment.tz(occurrences[0], schedule["beta:timeZone"]).format('YYYY-MM-DD');
  schedule.endDate = moment.tz(occurrences[occurrences.length - 1], schedule["beta:timeZone"]).format('YYYY-MM-DD');
  return schedule;
}

/**
 * @param {number} modified
 * @param {string} baseUrl
 * @param {boolean} golden
 */
function generatePartialSchedule(modified, baseUrl, golden) {
  var schedule = generateSchedule(modified, baseUrl, golden);
  return {
    "type": "PartialSchedule",
    "repeatFrequency": schedule.repeatFrequency,
    "startTime": schedule.startTime,
    "endTime": schedule.endTime,
    "byDay": schedule.byDay,
    "duration": schedule.duration
  };
}

const byDayMap = {
  "https://schema.org/Monday": RRule.MO,
  "https://schema.org/Tuesday": RRule.TU,
  "https://schema.org/Wednesday": RRule.WE,
  "https://schema.org/Thursday": RRule.TH,
  "https://schema.org/Friday": RRule.FR,
  "https://schema.org/Saturday": RRule.SA,
  "https://schema.org/Sunday": RRule.SU
};

function generateDatesFromSchedule(schedules, modified) {
  const rruleSet = new RRuleSet()

  // Add a rrule to rruleSet
  schedules.forEach(schedule => {
    var frequency = moment.duration(schedule.repeatFrequency);
    var tzid = schedule["beta:timeZone"] || "Europe/London";
    var freq;
    var interval;
    if (frequency.asWeeks() > 0) { //only support weekly and daily for now
      freq = RRule.WEEKLY;
      interval = frequency.asWeeks();
    } else {
      freq = RRule.DAILY; 
      interval = frequency.asDays();
    }

    // Create a rule:
    const rule = new RRule({
      freq: freq,
      interval: interval,
      byweekday: schedule.byDay.map(day => byDayMap[day]),
      dtstart: moment(schedule.startDate + "T" + schedule.startTime + "Z").utc().toDate(),
      until: moment(schedule.endDate + "T" + schedule.startTime + "Z").utc().toDate(),
      tzid: tzid
    })

    rruleSet.rrule(rule);
  });

  // Get a slice:
  return rruleSet.between(moment.unix(modified).day(-2).utc().toDate(), moment.unix(modified).day(16).utc().toDate(), true)
}

function generateSlotDates(modified, slotDuration, tzid) {
  const rule = new RRule({
    freq: RRule.MINUTELY,
    dtstart: moment.unix(modified).day(-7).utc().startOf('day').toDate(),
    interval: slotDuration,
    byhour: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    tzid: tzid
  })

  // Get a slice:
  return rule.between(moment.unix(modified).day(-7).startOf('day').utc().toDate(), moment.unix(modified).day(21).startOf('day').utc().toDate(), true)
}


/**
 * @param {(ReturnType<typeof generateSchedule> | ReturnType<typeof generatePartialSchedule>)[]} schedules
 * @param {number} modified
 * @param {string} eventAttendanceMode
 * @param {number} maximumAttendeeCapacity
 * @param {number} maximumVirtualAttendeeCapacity
 * @param {string} baseUrl
 * @param {boolean} golden
 */
function generateSubEvents(schedules, modified, eventAttendanceMode, maximumAttendeeCapacity, maximumVirtualAttendeeCapacity, baseUrl, golden) {
  return schedules.map(schedule =>
    generateDatesFromSchedule([schedule], modified).map(startDate =>
      generateSubEvent(startDate, schedule.duration, schedule["beta:timeZone"], modified, eventAttendanceMode, maximumAttendeeCapacity, maximumVirtualAttendeeCapacity, baseUrl, golden))
  ).reduce((acc, val) => acc.concat(val), []);
}

function generateSlots(seed, baseUrl, golden) {
  var modified = seed.modified;
  var slotDuration = faker.random.arrayElement([30, 60, 120]);
  var maximumUses = faker.random.number(12);
  var tzid = "Europe/London";
  return generateSlotDates(modified, slotDuration, tzid).map(o => generateSlot(o, slotDuration, tzid, modified, maximumUses, baseUrl, golden));
}

function generateSlot(startDateString, durationMinutes, tzid, modified, maximumUses, baseUrl, golden) {
  var startDate = moment.tz(startDateString, tzid);
  var duration = moment.duration(durationMinutes, 'minutes');
  var endDate = startDate.clone().add(duration);
  var remainingUses = faker.random.number(maximumUses);
  var data = {
    "@context": "https://openactive.io/",
    "type": "Slot",
    "id": baseUrl + "/api/facility-uses/" + modified + "/slots/" + moment.tz(startDateString, null).format(),
    "facilityUse": baseUrl + "/api/facility-uses/" + modified,
    "startDate": startDate.format(),
    "endDate": endDate.format(),
    "duration": duration.toISOString(),
    "maximumUses": maximumUses,
    "remainingUses": remainingUses,
    "offers": [
      {
        "type": "Offer",
        "name": durationMinutes + " minute hire",
        "price": faker.random.number(12) + (faker.random.boolean() ? 0.5 : 0),
        "priceCurrency": "GBP",
        "url": baseUrl + "/listings/facility-uses/" + modified + "#" + moment.tz(startDateString, null).format() + "-booking",
      }
    ]
  };
  // return {data, subId: startDate.unix(), deleted: (golden ? false : faker.random.boolean())};
  // Only state:updated slots for now
  return {data, subId: startDate.unix(), deleted: false };
}

/**
 * @param {Date} startDate
 * @param {string} duration
 * @param {string} tzid
 * @param {number} modified
 * @param {string} eventAttendanceMode
 * @param {number} maximumAttendeeCapacity
 * @param {number} maximumVirtualAttendeeCapacity
 * @param {string} baseUrl
 * @param {boolean} golden
 */
function generateSubEvent(startDate, duration, tzid, modified, eventAttendanceMode, maximumAttendeeCapacity, maximumVirtualAttendeeCapacity, baseUrl, golden) {
  var startDateMoment = moment.tz(startDate, tzid);
  var endDate = startDateMoment.clone().add(moment.duration(duration));
  var remainingAttendeeCapacity = faker.random.number(maximumAttendeeCapacity);
  return {
    "type": "ScheduledSession",
    "id": baseUrl + "/api/opportunities/" + modified + "#/subEvent/" + moment.tz(startDate, null).format(),
    "identifier": moment.tz(startDate, null).format(),
    "startDate": startDateMoment.format(),
    "endDate": endDate.format(),
    "duration": duration,
    "maximumAttendeeCapacity": maximumAttendeeCapacity,
    "remainingAttendeeCapacity": remainingAttendeeCapacity,
    "maximumVirtualAttendeeCapacity": (eventAttendanceMode === EVENT_ATTENDANCE_MODES.OFFLINE
      ? null
      : (golden
        ? maximumVirtualAttendeeCapacity
        : faker.random.arrayElement([maximumVirtualAttendeeCapacity, null]))),
    'beta:virtualLocation': (eventAttendanceMode === EVENT_ATTENDANCE_MODES.OFFLINE
      ? null
      : {
        type: 'VirtualLocation',
        url: `https://zoom.us/j/${faker.random.number(9999999)}/signup`,
        name: faker.lorem.words(3),
        description: golden ? faker.lorem.words(20) : faker.random.arrayElement([null, faker.lorem.words(20)]),
      }),
    "eventStatus": "https://schema.org/EventScheduled",
    "url": baseUrl + "/listings/" + modified + "#" + moment.tz(startDate, null).format()
  }
}

function generateOrganzier(orgBaseUrl, baseUrl, golden) {
  var company = faker.company.companyName();
  var socialMedia = company.toLowerCase().replace(/[^a-z]*/g,"");
  var id = faker.finance.bic();
  return {
    "type": "Organization",
    "id": baseUrl + "/api/organizations/" + id,
    "identifier": id,
    "name": company,
    "url": orgBaseUrl,
    "logo": {
      "type": "ImageObject",
      "url": faker.image.avatar()
    },
    "telephone": faker.phone.phoneNumber(),
    "sameAs": [
      "https://www.facebook.com/" + socialMedia + "/",
      "https://twitter.com/" + socialMedia
    ]
  }
}

function generatePerson(baseUrl, golden) {
  var gender = faker.random.number(1);
  var id = faker.finance.bic();
  var givenName = faker.name.firstName(gender);
  var familyName = faker.name.lastName(gender);
  var name = givenName + " " + familyName;
  var liteRecord = golden ? false : faker.random.boolean();

  return {
    "type": "Person",
    "id": baseUrl + "/api/leaders/" + id,
    "identifier": id,
    "name": name,
    "familyName": liteRecord ? null : familyName,
    "givenName": liteRecord ? null : givenName,
    "gender": golden || faker.random.boolean() ? ["https://schema.org/Male","https://schema.org/Female"][gender] : null,    
    "jobTitle": faker.random.arrayElement(["Leader", "Team leader", "Host", "Instructor", "Coach", golden ? "Captain" : null]),
    "telephone": liteRecord ? null : faker.phone.phoneNumber("07## ### ####"),
    "email": liteRecord ? null : faker.internet.exampleEmail(),
    "url": faker.internet.url() + "/profile/" + faker.random.number(50),
    "image": {
      "type": "ImageObject",
      "url": faker.internet.avatar()
    }
  };
}

/**
 * @param {string} orgBaseUrl
 * @param {boolean} golden
 */
function generatePlace(orgBaseUrl, golden) {
  var siteName = faker.address.streetName() + " " + faker.random.arrayElement(["Sports Village", "Leisure Centre", "Centre"]);
  var postcodeObj = postcodes[faker.random.number(postcodes.length - 1)];
  return {
    "type": "Place",
    "url": orgBaseUrl + "/" + faker.random.arrayElement(["sites", "centres", "locations"]) + "/" + faker.helpers.slugify(siteName.toLowerCase()),
    "name": siteName,
    "description": faker.lorem.paragraphs(golden ? 4 : faker.random.number(4)),
    "identifier": faker.finance.bic(),
    "address": {
      "type": "PostalAddress",
      "streetAddress": faker.address.streetAddress(),
      "addressLocality": "Oxford",
      "addressRegion": "Oxfordshire",
      "postalCode": postcodeObj.postcode,
      "addressCountry": "GB"
    },
    "telephone": faker.phone.phoneNumber(),
    "geo": {
      "type": "GeoCoordinates",
      "latitude": postcodeObj.latitude,
      "longitude": postcodeObj.longitude
    },
    "image": generateImages(),
    "amenityFeature": generateAmenityFeature(golden),
    "openingHoursSpecification": [
      {
        "type": "OpeningHoursSpecification",
        "dayOfWeek": "https://schema.org/Sunday",
        "opens": "09:00",
        "closes": "17:30"
      },
      {
        "type": "OpeningHoursSpecification",
        "dayOfWeek": "https://schema.org/Monday",
        "opens": "06:30",
        "closes": "21:30"
      },
      {
        "type": "OpeningHoursSpecification",
        "dayOfWeek": "https://schema.org/Tuesday",
        "opens": "06:30",
        "closes": "21:30"
      },
      {
        "type": "OpeningHoursSpecification",
        "dayOfWeek": "https://schema.org/Wednesday",
        "opens": "06:30",
        "closes": "21:30"
      },
      {
        "type": "OpeningHoursSpecification",
        "dayOfWeek": "https://schema.org/Thursday",
        "opens": "06:30",
        "closes": "21:30"
      },
      {
        "type": "OpeningHoursSpecification",
        "dayOfWeek": "https://schema.org/Friday",
        "opens": "06:30",
        "closes": "20:30"
      },
      {
        "type": "OpeningHoursSpecification",
        "dayOfWeek": "https://schema.org/Saturday",
        "opens": "07:15",
        "closes": "17:30"
      }
    ]
  };
}

function generateConcepts(scheme, golden, large, min, max) {
  var outputConcepts = [];
  if (large) {
    var index = {};
    // Bias random count towards 1
    var maxCount = faker.random.number({min: min, max: max + 10});
    if (maxCount > max) maxCount = 1; 

    for (var i = 0; i < maxCount; i++) {
      // Use the sample set for 50% of cases
      var conceptList = faker.random.boolean() && typeof schemes[scheme].sample !== 'undefined' ? schemes[scheme].sample : schemes[scheme].concept;
      var concept = conceptList[faker.random.number(conceptList.length - 1)];

      // Check we're not duplicating concepts as we pick them
      if (!index[concept.id]) {
        outputConcepts.push(concept);
        index[concept.id] = true;
      }
    }
  } else if (!large && min == 1 && max == 1) {
    var conceptList = schemes[scheme].concept;
    outputConcepts = [faker.random.arrayElement(conceptList)];
  } else {
    var conceptList = schemes[scheme].concept;
    var slice = golden ? 0 : faker.random.number({min: 0, max: conceptList.length - min});
    outputConcepts = faker.helpers.shuffle(conceptList).slice(slice);
  }

  return outputConcepts.map(concept => { return {
    "type": "Concept",
    "id": concept.id,
    "prefLabel": concept.prefLabel,
    "inScheme": schemes[scheme].id
  }});
}

function removeEmpty (obj) { 
  Object.entries(obj).forEach(([key, val]) => {
    if (Array.isArray(val) && val.length == 0) {
      delete obj[key]
    } else {
      if (val && typeof val === 'object') removeEmpty(val)
      else if (val === null || val === "") delete obj[key]
    }
  });
}

/**
 * @param {{ modified: number, id: number }} seed
 * @param {string} baseUrl
 * @param {boolean} golden
 */
function generateSessionSeriesItemData(seed, baseUrl, golden) {
  var orgBaseUrl = faker.internet.url();
  var debugTime = moment.unix(seed.modified).format();
  var schedules = golden || faker.random.boolean()
    ?  ( golden || faker.random.boolean()
      ? [generateSchedule(seed.modified, baseUrl, golden), generateSchedule(seed.modified, baseUrl, golden)]
      : [generateSchedule(seed.modified, baseUrl, golden)])
    : [ generatePartialSchedule(seed.modified, baseUrl, golden) ];
  var maximumAttendeeCapacity = faker.random.number({min: 1, max: 6}) * 10;
  const eventAttendanceMode = (golden
    ? EVENT_ATTENDANCE_MODES.MIXED
    // Heavily biased toward non-offline modes during these dark and uncertain times (COVID19)
    : faker.random.arrayElement([
      EVENT_ATTENDANCE_MODES.ONLINE, EVENT_ATTENDANCE_MODES.ONLINE,
      EVENT_ATTENDANCE_MODES.MIXED, EVENT_ATTENDANCE_MODES.MIXED,
      EVENT_ATTENDANCE_MODES.OFFLINE]));
  const maximumVirtualAttendeeCapacity = faker.random.number({ min: 1, max: 6}) * 10;
  var subEvents = (schedules[0].type == "PartialSchedule")
    ? null
    : generateSubEvents(schedules, seed.modified, eventAttendanceMode, maximumAttendeeCapacity, maximumVirtualAttendeeCapacity, baseUrl, golden);
  var isAccessibleForFree = !golden || faker.random.boolean();
  var data = {
    "@context": [ "https://openactive.io/", "https://openactive.io/ns-beta", "https://data.emduk.org/ns/emduk.jsonld" ],
    "id": baseUrl + "/api/session-series/" + seed.id,
    "identifier": seed.id,
    "ext:dateCreated": debugTime,
    "type": "SessionSeries",
    "name": (golden ? "GOLDEN: " : "") + "Virtual BODYPUMP",
    "eventAttendanceMode": eventAttendanceMode,
    "description": faker.lorem.paragraphs(golden ? 4 : faker.random.number(4)),
    "url": baseUrl + "/listings/" + seed.id,
    "attendeeInstructions": generateAttendeeInstructions(golden),
    "genderRestriction": faker.random.arrayElement(["https://openactive.io/NoRestriction", "https://openactive.io/MaleOnly", "https://openactive.io/FemaleOnly"]),
    "ageRange": generateAgeRange(golden),
    "level": faker.helpers.shuffle(["Beginner", "Intermediate", "Advanced"]).slice(faker.random.number(golden ? {min: 0, max: 1} : { max: 3 })),
    "organizer": faker.random.boolean() ? generateOrganzier(orgBaseUrl, baseUrl, golden) : generatePerson(baseUrl, golden),
    "activity": generateConcepts("activity-list", golden, true, 1, 3),
    "accessibilitySupport": generateConcepts("accessibility-support", golden, false, 0),
    "accessibilityInformation": faker.lorem.paragraphs(golden ? 2 : faker.random.number(2)),
    "beta:isWheelchairAccessible": golden || faker.random.boolean() ? faker.random.boolean() : null,
    "emduk:specialRequirement": generateConcepts("special-requirements", golden, false, 0),
    "category": [
      "Group Exercise Classes",
      "Toning & Strength",
      "Group Exercise - Virtual"
    ],
    "image": generateImages(golden),
    "beta:video": golden || faker.random.boolean() ? [
      {
        "type": "VideoObject",
        "url": "https://www.youtube.com/watch?v=xvDZZLqlc-0"
      }
    ] : null,
    "leader": generateArrayOf(generatePerson, baseUrl, seed.id, golden, {min: 0, max: 2}),
    "contributor": generateArrayOf(generatePerson, baseUrl, seed.id, golden, {min: 0, max: 4}),
    "isCoached": golden || faker.random.boolean() ? faker.random.boolean() : null,
    // location MUST not be provided for fully virtual sessions
    "location": (eventAttendanceMode === EVENT_ATTENDANCE_MODES.ONLINE) ? null : generatePlace(orgBaseUrl, golden),
    // beta:affiliatedLocation MAY be provided for fully virtual sessions
    "beta:affiliatedLocation": (eventAttendanceMode === EVENT_ATTENDANCE_MODES.ONLINE && faker.random.boolean())
      ? generatePlace(orgBaseUrl, golden)
      : null,
    "eventSchedule": golden || schedules[0].type == "PartialSchedule" || faker.random.boolean() ? schedules : null,
    "schedulingNote": golden || faker.random.boolean() ? faker.random.arrayElement(["Sessions are not running during school holidays.", "Sessions may be cancelled with 15 minutes notice, please keep an eye on your e-mail.", "Sessions are scheduled with best intentions, but sometimes need to be rescheduled due to venue availability. Ensure that you contact the organizer before turning up."]) : null,
    "maximumAttendeeCapacity": maximumAttendeeCapacity,
    "duration": "PT30M",
    "subEvent": subEvents,
    "isAccessibleForFree": isAccessibleForFree,
    "offers": generateOffers(baseUrl, seed.id, golden, isAccessibleForFree),
    "programme": generateBrand(golden),
    'beta:isInteractivityPreferred': (eventAttendanceMode === EVENT_ATTENDANCE_MODES.OFFLINE
      ? null
      : (golden
        ? true
        : faker.random.arrayElement([true, false, null]))),
    'beta:isVirtuallyCoached': (eventAttendanceMode === EVENT_ATTENDANCE_MODES.OFFLINE
      ? null
      : (golden
        ? true
        : faker.random.arrayElement([true, false, null]))),
    'beta:participantSuppliedEquipment': (eventAttendanceMode === EVENT_ATTENDANCE_MODES.OFFLINE
      ? null
      : (golden
        ? 'https://openactive.io/Optional'
        : faker.random.arrayElement([
          'https://openactive.io/Required',
          'https://openactive.io/Optional',
          'https://openactive.io/Unavailable',
          null]))),
  };
  return [{ data }];
}

function generateFacilityUseItemData(seed, baseUrl, golden) {
  var orgBaseUrl = faker.internet.url();
  var siteName = faker.address.streetName() + " " + faker.random.arrayElement(["Sports Village", "Leisure Centre", "Centre"]);
  var debugTime = moment.unix(seed.modified).format();
  var postcodeObj = postcodes[faker.random.number(postcodes.length - 1)];
  var isAccessibleForFree = !golden || faker.random.boolean();
  var activity = generateConcepts("facility-activity-list", golden, false, 1, 1);
  var data = {
    "@context": [ "https://openactive.io/", "https://openactive.io/ns-beta" ],
    "id": baseUrl + "/api/facility-uses/" + seed.id,
    "identifier": seed.id,
    "ext:dateCreated": debugTime,
    "type": "FacilityUse",
    "name": (golden ? "GOLDEN: " : "") + activity[0].prefLabel,
    "description": faker.lorem.paragraphs(golden ? 4 : faker.random.number(4)),
    "activity": activity,
    "provider": generateOrganzier(orgBaseUrl, baseUrl, golden),
    "url": baseUrl + "/listings/facility-uses/" + seed.id,
    "attendeeInstructions": faker.lorem.paragraphs(golden ? 2 : faker.random.number(2)),
    "accessibilitySupport": generateConcepts("accessibility-support", golden, false, 0),
    "accessibilityInformation": faker.lorem.paragraphs(golden ? 2 : faker.random.number(2)),
    "beta:isWheelchairAccessible": golden || faker.random.boolean() ? faker.random.boolean() : null,
    "category": [
      "Bookable Facilities",
      "Ball Sports"
    ],
    "image": generateImages(golden),
    "beta:video": golden || faker.random.boolean() ? [
      {
        "type": "VideoObject",
        "url": "https://www.youtube.com/watch?v=xvDZZLqlc-0"
      }
    ] : null,
    "location": {
      "type": "Place",
      "url": orgBaseUrl + "/" + faker.random.arrayElement(["sites", "centres", "locations"]) + "/" + faker.helpers.slugify(siteName.toLowerCase()),
      "name": siteName,
      "description": faker.lorem.paragraphs(golden ? 4 : faker.random.number(4)),
      "identifier": faker.finance.bic(),
      "address": {
        "type": "PostalAddress",
        "streetAddress": faker.address.streetAddress(),
        "addressLocality": "Oxford",
        "addressRegion": "Oxfordshire",
        "postalCode": postcodeObj.postcode,
        "addressCountry": "GB"
      },
      "telephone": faker.phone.phoneNumber(),
      "geo": {
        "type": "GeoCoordinates",
        "latitude": postcodeObj.latitude,
        "longitude": postcodeObj.longitude
      },
      "image": generateImages(),
      "amenityFeature": generateAmenityFeature(golden),
      "openingHoursSpecification": [
        {
          "type": "OpeningHoursSpecification",
          "dayOfWeek": "https://schema.org/Sunday",
          "opens": "09:00",
          "closes": "17:30"
        },
        {
          "type": "OpeningHoursSpecification",
          "dayOfWeek": "https://schema.org/Monday",
          "opens": "06:30",
          "closes": "21:30"
        },
        {
          "type": "OpeningHoursSpecification",
          "dayOfWeek": "https://schema.org/Tuesday",
          "opens": "06:30",
          "closes": "21:30"
        },
        {
          "type": "OpeningHoursSpecification",
          "dayOfWeek": "https://schema.org/Wednesday",
          "opens": "06:30",
          "closes": "21:30"
        },
        {
          "type": "OpeningHoursSpecification",
          "dayOfWeek": "https://schema.org/Thursday",
          "opens": "06:30",
          "closes": "21:30"
        },
        {
          "type": "OpeningHoursSpecification",
          "dayOfWeek": "https://schema.org/Friday",
          "opens": "06:30",
          "closes": "20:30"
        },
        {
          "type": "OpeningHoursSpecification",
          "dayOfWeek": "https://schema.org/Saturday",
          "opens": "07:15",
          "closes": "17:30"
        }
      ]
    },
    "isAccessibleForFree": isAccessibleForFree,
    "offers": generateOffers(baseUrl, seed.id, golden, isAccessibleForFree),
    "hoursAvailable": [
      {
        "type": "OpeningHoursSpecification",
        "dayOfWeek": "https://schema.org/Sunday",
        "opens": "09:00",
        "closes": "17:30"
      },
      {
        "type": "OpeningHoursSpecification",
        "dayOfWeek": "https://schema.org/Monday",
        "opens": "06:30",
        "closes": "21:30"
      },
      {
        "type": "OpeningHoursSpecification",
        "dayOfWeek": "https://schema.org/Tuesday",
        "opens": "06:30",
        "closes": "21:30"
      },
      {
        "type": "OpeningHoursSpecification",
        "dayOfWeek": "https://schema.org/Wednesday",
        "opens": "06:30",
        "closes": "21:30"
      },
      {
        "type": "OpeningHoursSpecification",
        "dayOfWeek": "https://schema.org/Thursday",
        "opens": "06:30",
        "closes": "21:30"
      },
      {
        "type": "OpeningHoursSpecification",
        "dayOfWeek": "https://schema.org/Friday",
        "opens": "06:30",
        "closes": "20:30"
      },
      {
        "type": "OpeningHoursSpecification",
        "dayOfWeek": "https://schema.org/Saturday",
        "opens": "07:15",
        "closes": "17:30"
      }
    ]
  };
  return [{ data }];
}

/**
 * @param {{ modified: number }} seed
 * @param {string} baseUrl
 * @param {string} kind
 */
function generateItemWithGenerator(seed, baseUrl, kind, itemGenerator) {
  faker.locale = "en_GB";
  faker.seed(seed.modified);
  const seedWithId = { ...seed, id: seed.modified };
  var data = itemGenerator(seedWithId, baseUrl, faker.random.boolean());
  var itemArray = data.map((item) => {
    var singleItem = {
      "state": item.deleted ? "deleted" : "updated",
      "kind": kind,
      "id": item.subId ? seedWithId.id + '-' + item.subId : seedWithId.id,
      "modified": seedWithId.modified,
      "data": item.deleted ? null : item.data
    };
    removeEmpty(singleItem);
    return singleItem;
  });

  return itemArray;
}

/**
 * @param {string} feedType
 * @param {{ modified: number }} seed
 * @param {string} baseUrl
 */
function generateItem(feedType, seed, baseUrl) {
  if (feedType == "session-series") {
    return generateItemWithGenerator(seed, baseUrl, "SessionSeries", generateSessionSeriesItemData);
  } else if (feedType == "facility-uses") {
    return generateItemWithGenerator(seed, baseUrl, "FacilityUse", generateFacilityUseItemData);
  } else if (feedType == "slots") {
    return generateItemWithGenerator(seed, baseUrl, "FacilityUse/Slot", generateSlots);
  } else {
    throw new Error("Invalid feed specified");
  }
}

function baseUrl(req) {
  return (req.headers["x-forwarded-proto"] || req.protocol) + '://' + req.get('host');
}

module.exports = {
  generateItem,
  baseUrl
};
