var faker = require('faker');
var postcodes = require('./postcodes');
var schemes = require('./schemes');
var moment = require('moment-timezone');
const { DateTime, Duration } = require('luxon');
var RRule = require('rrule').RRule;
var RRuleSet = require('rrule').RRuleSet;


function generateImageUrl(w, h, seed) {
  return `https://picsum.photos/${w}/${h}?image=${seed}`;
}

function generateInstructionsFromList(golden, list) {
    return (golden ? list : faker.helpers.shuffle(list).slice(faker.random.number({min: 0, max: list.length - 2}))).join(", ");
}

function generateAttendeeInstructions(golden) {
  var clothingInstructions = "Clothing instructions: " + generateInstructionsFromList(golden, [
    "wear sportswear/gym clothes",
    "wear comfortable loose clothing",
    "come as you are",
    "bring trainers",
    "wear flat shoes",
    "no footwear required"
  ]) + ".";

  var equipment = "Equipment you need to bring: " + generateInstructionsFromList(golden, [
    "a water bottle",
    "a sweat towel",
    "hand weights",
    "an exercise mat",
    "boxing gloves",
    "a skipping rope",
    "a stretch band",
    "a locker padlock",
    "parking/locker money"
  ]) + ".";
  
  return golden || faker.random.boolean() ? clothingInstructions + "\n\n" + equipment : (faker.random.boolean() ? equipment : null );
}

function generateOffer(baseUrl, golden) {
  var ageRanges = {
    "Adult": {
      "type": "QuantitativeValue",
      "mixValue": 18,
      "maxValue": 60
    },
    "Junior": {
      "type": "QuantitativeValue",
      "maxValue": 18
    },
    "Senior": {
      "type": "QuantitativeValue",
      "minValue": 60
    }
  };
  var age = faker.random.arrayElement(Object.keys(ageRanges));
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
      "http://openactive.io/ns-beta#OnlinePrepayment",
      "http://openactive.io/ns-beta#TelephonePrepayment",
    ], golden),
    "acceptedPaymentMethod": getRandomElementsOf([
      "http://purl.org/goodrelations/v1#Cash",
      "http://purl.org/goodrelations/v1#PaymentMethodCreditCard"
    ], golden),
    "url": baseUrl + "/listings/" + seed.id + "#booking-" + age.toLowerCase()
  };
}

function generateImages(golden) {
  var out = [];
  var imageCount = faker.random.number(golden ? {min: 4, max: 6} : 6);
  for (var i = 0; i < imageCount; i++) {
    var imageSeed = faker.random.number(1083);
    out.push({
      "type": "ImageObject",
      "url": generateImageUrl(1024, 768, imageSeed),
      "thumbnail": {
        "type": "ImageObject",
        "url": generateImageUrl(672, 414, imageSeed) //672 × 414
      }
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

function generateArrayOf(generateFunction, baseUrl, golden, range) {
  var output = [];
  var maxCount = faker.random.number(golden ? range.max : range);
  for (var i = 0; i < maxCount; i++) {
    output.push(generateFunction(baseUrl, golden));
  }
  return output;
}

function generateSchedule(modified, baseUrl, golden) {
  var startTime = moment({hour: faker.random.number({min: 6, max: 22}), minute: faker.random.arrayElement([0, 15, 30, 45])});
  var duration = faker.random.arrayElement(["PT30M", "PT1H", "PT1H30M", "PT2H"]);
  var endTime = startTime.clone().add(moment.duration(duration));
  var schedule = {
    "type": "Schedule",
    "startDate": moment.unix(modified).day(-7).utc().format('YYYY-MM-DD'),
    "endDate": moment.unix(modified).day(faker.random.number({min: 14, max: 28})).utc().format('YYYY-MM-DD'),
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
  schedule.startDate = moment(occurrences[0]).format('YYYY-MM-DD');
  schedule.endDate = moment(occurrences[occurrences.length - 1]).day(1).format('YYYY-MM-DD');
  return schedule;
}

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
  "http://schema.org/Monday": RRule.MO,
  "http://schema.org/Tuesday": RRule.TU,
  "http://schema.org/Wednesday": RRule.WE,
  "http://schema.org/Thursday": RRule.TH,
  "http://schema.org/Friday": RRule.FR,
  "http://schema.org/Saturday": RRule.SA,
  "http://schema.org/Sunday": RRule.SU
};

function generateDatesFromSchedule(schedules, modified) {
  const rruleSet = new RRuleSet()

  // Add a rrule to rruleSet
  schedules.forEach(schedule => {
    var frequency = moment.duration(schedule.repeatFrequency);
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
      dtstart: DateTime.fromISO(schedule.startDate + "T" + schedule.startTime + "Z").toJSDate(),
      until: DateTime.fromISO(schedule.endDate).toJSDate(),
      tzid: schedule["beta:timeZone"] || "Europe/London"
    })

    rruleSet.rrule(rule);
  });

  //exceptDate

  // Get a slice:
  return rruleSet.between(moment.unix(modified).day(-7).utc().toDate(), moment.unix(modified).day(21).utc().toDate())
}

function generateSubEvents(schedule, modified, maximumAttendeeCapacity, baseUrl, golden) {
  return generateDatesFromSchedule([schedule], modified).map(o => generateSubEvent(o, schedule.duration, modified, maximumAttendeeCapacity, baseUrl, golden));
}

function generateSubEvent(startDateISO, duration, modified, maximumAttendeeCapacity, baseUrl, golden) {
  var startDate = DateTime.fromISO(startDateISO);
  var endDate = startDate.plus(Duration.fromISO(duration));
  var remainingAttendeeCapacity = faker.random.number(maximumAttendeeCapacity);
  return {
    "type": "ScheduledSession",
    "startDate": startDate.toISO(),
    "endDate": endDate.toISO(),
    "duration": duration,
    "maximumAttendeeCapacity": maximumAttendeeCapacity,
    "remainingAttendeeCapacity": remainingAttendeeCapacity,
    "eventStatus": "https://schema.org/EventScheduled",
    "url": baseUrl + "/listings/" + modified + "#" + startDateISO
  }
}

function generatePerson(baseUrl, golden) {
  var gender = faker.random.number(1);
  var id = faker.random.number(5000);
  var givenName = faker.name.firstName(gender);
  var familyName = faker.name.lastName(gender);
  var name = givenName + " " + familyName;
  var liteRecord = golden ? false : faker.random.boolean();

  return {
    "type": "Person",
    "name": name,
    "familyName": liteRecord ? null : familyName,
    "givenName": liteRecord ? null : givenName,
    "gender": golden || faker.random.boolean() ? ["https://schema.org/Male","https://schema.org/Female"][gender] : null,    
    "jobTitle": faker.random.arrayElement(["Leader", "Team leader", "Host", "Instructor", "Coach", null]),
    "telephone": liteRecord ? null : faker.phone.phoneNumber("07## ### ####"),
    "email": liteRecord ? null : faker.internet.exampleEmail(),
    "url": faker.internet.url() + "/profile/" + faker.random.number(50),
    "id": baseUrl + "/api/leaders/" + id,
    "identifier": id
  };
}

function generateConcepts(scheme, large, min, max) {
  var conceptList = schemes[scheme].concept;
  var outputConcepts = [];

  if (large) {
    var index = {};
    // Bias random count towards 1
    var maxCount = faker.random.number({min: min, max: max + 10});
    if (maxCount > max) maxCount = 1; 

    for (var i = 0; i < maxCount; i++) {
      var conceptIndex = faker.random.number(conceptList.length - 1);
      // Check we're not duplicating concepts as we pick them
      if (!index[conceptIndex]) {
        outputConcepts.push(conceptList[conceptIndex]);
        index[conceptIndex] = true;
      }
    }
  } else {
    var maxCount = faker.random.number({min: min, max: conceptList.length - 1});
    outputConcepts = faker.helpers.shuffle(conceptList).slice(maxCount);
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

function generateItemData(seed, baseUrl, golden) {
  var company = faker.company.companyName();
  var socialMedia = company.toLowerCase().replace(/[^a-z]*/g,"");
  var orgBaseUrl = faker.internet.url();
  var siteName = faker.address.streetName() + " " + faker.random.arrayElement(["Sports Village", "Leisure Centre", "Centre"]);
  var debugTime = moment.unix(seed.modified).format();
  var postcodeObj = postcodes[faker.random.number(postcodes.length - 1)];
  var schedule = golden || faker.random.boolean() ? generateSchedule(seed.modified, baseUrl, golden) : generatePartialSchedule(seed.modified, baseUrl, golden);
  var maximumAttendeeCapacity = faker.random.number({min: 1, max: 6}) * 10;
  var subEvents = (schedule.type == "PartialSchedule" ? null : generateSubEvents(schedule, seed.modified, maximumAttendeeCapacity, baseUrl, golden) );
  return {
    "@context": [ "https://openactive.io/", "https://openactive.io/ns-beta", "http://data.emduk.org/ns/emduk.jsonld" ],
    "id": baseUrl + "/api/opportunities/" + seed.id,
    "identifier": seed.id,
    "ext:dateCreated": debugTime,
    "type": "SessionSeries",
    "organizer": {
      "type": "Organization",
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
    },
    "activity": generateConcepts("activity-list", true, 1, 3),
    "accessibilitySupport": generateConcepts("accessibility-support", false, 0),
    "accessibilityInformation": faker.lorem.paragraphs(golden ? 2 : faker.random.number(2)),
    "beta:isWheelchairAccessible": golden || faker.random.boolean() ? faker.random.boolean() : null,
    "emduk:specialRequirements": generateConcepts("special-requirements", false, 0),
    "category": [
      "Group Exercise Classes",
      "Toning & Strength",
      "Group Exercise - Virtual"
    ],
    "name": (golden ? "GOLDEN: " : "") + "Virtual BODYPUMP",
    "description": faker.lorem.paragraphs(golden ? 4 : faker.random.number(4)),
    "attendeeInstructions": generateAttendeeInstructions(golden),
    "genderRestriction": faker.random.arrayElement(["https://openactive.io/NoRestriction", "https://openactive.io/MaleOnly", "https://openactive.io/FemaleOnly"]),
    "ageRange": generateAgeRange(golden),
    "level": faker.helpers.shuffle(["Beginner", "Intermediate", "Advanced"]).slice(faker.random.number(golden ? {min: 0, max: 1} : 3)),
    "image": generateImages(golden),
    "url": baseUrl + "/listings/" + seed.id,
    "leader": generateArrayOf(generatePerson, baseUrl, golden, {min: 0, max: 2}),
    "contributor": generateArrayOf(generatePerson, baseUrl, golden, {min: 0, max: 4}),
    "isCoached": golden || faker.random.boolean() ? faker.random.boolean() : null,
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
    "eventSchedule": schedule,
    "schedulingNote": golden || faker.random.boolean() ? faker.random.arrayElement(["Sessions are not running during school holidays.", "Sessions may be cancelled with 15 minutes notice, please keep an eye on your e-mail.", "Sessions are scheduled with best intentions, but sometimes need to be rescheduled due to venue availability. Ensure that you contact the organizer before turning up."]) : null,
    "maximumAttendeeCapacity": maximumAttendeeCapacity,
    "subEvent": subEvents,
    "offers": [
      {
        "type": "Offer",
        "name": "Adult",
        "price": faker.random.number(3000)/100,
        "priceCurrency": "GBP",
        "eligibleCustomerType": faker.random.boolean() ? ["https://openactive.io/ns-beta#Member"] : null,
        "url": baseUrl + "/listings/" + seed.id + "#booking-adult"
      },
      {
        "type": "Offer",
        "name": "Junior",
        "price": faker.random.number(3000)/100,
        "priceCurrency": "GBP",
        "eligibleCustomerType": faker.random.boolean() ? ["https://openactive.io/ns-beta#Member"] : null,
        "ageRange": {
          "type": "QuantitativeValue",
          "maxValue": 18
        },
        "beta:availableChannel": [
          "http://openactive.io/ns-beta#OnlinePrepayment",
          "http://openactive.io/ns-beta#TelephonePrepayment",
        ],
        "acceptedPaymentMethod": [
          "http://purl.org/goodrelations/v1#Cash",
          "http://purl.org/goodrelations/v1#PaymentMethodCreditCard"
        ],
        "url": baseUrl + "/listings/" + seed.id + "#booking-junior"
      }
    ],
    "duration": "PT30M"
  };
}

function generateItem(seed, baseUrl) {
  faker.locale = "en_GB";
  faker.seed(seed.modified);
  seed.id = seed.modified;
  var data = generateItemData(seed, baseUrl, faker.random.boolean());
  removeEmpty(data);
  return {
    "state": "updated",
    "kind": "SessionSeries",
    "id": seed.id,
    "modified": seed.modified,
    "data": data
  }
}

function baseUrl(req) {
  return (req.headers["x-forwarded-proto"] || req.protocol) + '://' + req.get('host');
}

module.exports = {
  generateItem,
  baseUrl
};