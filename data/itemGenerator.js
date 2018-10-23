var faker = require('faker');
var postcodes = require('./postcodes');
var schemes = require('./schemes');
var moment = require('moment') ;


function generateImageUrl(w, h, seed) {
  return `https://picsum.photos/${w}/${h}?image=${seed}`;
}

function generateImages() {
  var out = [];
  var imageCount = faker.random.number(6);
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

function generateAgeRange() {
  var maxAgeCeiling = faker.random.number(80);
  var maxAge = faker.random.boolean() ? maxAgeCeiling : null;
  var minAge = faker.random.boolean() ? faker.random.number(maxAge || 60) : null;
  if (maxAge == null && minAge == null) minAge = 0;
  var output = {
    "type": "QuantitativeValue"
  };
  if (minAge != null) output.minValue = minAge;
  if (maxAge != null) output.maxValue = maxAge;
  return output;
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

function generateItemData(seed, baseUrl) {
  var company = faker.company.companyName();
  var socialMedia = company.toLowerCase().replace(/[^a-z]*/g,"");
  var orgBaseUrl = faker.internet.url();
  var siteName = faker.address.streetName() + " " + faker.random.arrayElement(["Sports Village", "Leisure Centre", "Centre"]);
  var debugTime = moment.unix(seed.modified).format();
  var postcodeObj = postcodes[faker.random.number(postcodes.length - 1)];

  return {
    "@context": "https://openactive.io/",
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
    "emduk:specialRequirements": generateConcepts("special-requirements", false, 0),
    "category": [
      "Group Exercise Classes",
      "Toning & Strength",
      "Group Exercise - Virtual"
    ],
    "name": "Virtual BODYPUMP",
    "description": faker.lorem.paragraphs(faker.random.number(4)),
    "genderRestriction": faker.random.arrayElement(["https://openactive.io/NoRestriction", "https://openactive.io/MaleOnly", "https://openactive.io/FemaleOnly"]),
    "ageRange": generateAgeRange(),
    "level": faker.helpers.shuffle(["Beginner", "Intermediate", "Advanced"]).slice(faker.random.number(3)),
    "image": generateImages(),
    "url": baseUrl + "/listings/" + seed.id,
    "location": {
      "type": "Place",
      "url": orgBaseUrl + "/" + faker.random.arrayElement(["sites", "centres", "locations"]) + "/" + faker.helpers.slugify(siteName.toLowerCase()),
      "name": siteName,
      "description": faker.lorem.paragraphs(faker.random.number(4)),
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
      "amenityFeature": [
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
      ],
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
    "eventSchedule": [
      {
        "type": "PartialSchedule",
        "repeatFrequency": "P1W",
        "startTime": "20:15",
        "endTime": "20:45",
        "byDay": [
          "http://schema.org/Tuesday"
        ]
      }
    ],
    "subEvent": [
      {
        "type": "ScheduledSession",
        "startDate": "2018-10-02T19:15:00Z",
        "endDate": "2018-10-02T19:45:00Z",
        "remainingAttendeeCapacity": 2,
        "maximumAttendeeCapacity": 16,
        "eventStatus": "https://schema.org/EventScheduled",
        "identifier": 1400109454
      },
      {
        "type": "ScheduledSession",
        "startDate": "2018-10-09T19:15:00Z",
        "endDate": "2018-10-09T19:45:00Z",
        "remainingAttendeeCapacity": 12,
        "maximumAttendeeCapacity": 16,
        "eventStatus": "https://schema.org/EventScheduled",
        "identifier": 1400109455
      }
    ],
    "offers": [
      {
        "type": "Offer",
        "name": "Adult",
        "price": faker.random.number(3000)/100,
        "priceCurrency": "GBP",
        "url": baseUrl + "/listings/" + seed.id + "#booking-adult"
      },
      {
        "type": "Offer",
        "name": "Junior",
        "price": faker.random.number(3000)/100,
        "priceCurrency": "GBP",
        "ageRange": {
          "type": "QuantitativeValue",
          "maxValue": 18
        },
        "url": baseUrl + "/listings/" + seed.id + "#booking-junior"
      }
    ],
    "duration": "PT30M"
  };
}

function generateItem(seed, baseUrl) {
  faker.locale = "en_GB";
  faker.seed(seed.modified);
  seed.id = faker.random.number();
  var data = generateItemData(seed, baseUrl);
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