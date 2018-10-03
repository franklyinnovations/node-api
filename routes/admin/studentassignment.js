var studentassignment = require('../../controllers/studentassignment');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');

/* GET  */
router.post('/', upload.array(), function (req, res) {
	studentassignment.list(req, function(result){
		res.send(result);
	});
});

router.post('/view', upload.array(), function (req, res) {
	studentassignment.viewData(req, function(result){
		res.send(result);
	});
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
