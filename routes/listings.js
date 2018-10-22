var express = require('express');
var router = express.Router();

var itemGenerator = require('../data/itemGenerator');

/* GET home page. */
router.get('/:id', function(req, res, next) {
  var item = itemGenerator.generateItem({modified: +req.params.id}, itemGenerator.baseUrl(req))
  res.render('listing', item.data);
});

module.exports = router;
