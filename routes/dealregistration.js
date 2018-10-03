var dealregistration = require('../controllers/dealregistration');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();





router.post('/register',  upload.array(), function(req, res, next) {
	 var data = req.body;
 	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
   dealregistration.save(data, function(result){
                res.send(result);
      }); 
});

  /* add */
router.post('/add', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
   dealregistration.getMetaInformations(data, function(result){
                res.send(result);
      }); 
  
});



module.exports = router;
