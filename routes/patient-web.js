var patient_web = require('../controllers/patient_web');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var auth = require('../config/auth');
var crypto = require('crypto');
var mongoDB = require('../config/mongo_config');
var language = require('../controllers/language');

router.post('/cities', upload.array(), function (req, res) {
	Promise.resolve(patient_web.getCitiesByCountryId(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/filter_records', upload.array(), function (req, res) {
	var limit = 20;
	var page = req.body.pageNo || 1;
	//if(page>1){
	var skip = limit * (page - 1);
	//}else{
	// var skip=0;
	//}
	var collection = mongoDB.get().collection('records');
	var find_json = {
		langId: req.body.langId.toString(),
		title: new RegExp(req.body.title, 'i')
	}
	collection.find(find_json).skip(skip).limit(limit).toArray(function (err, countData) {
		res.send({
			status: true,
			message: language.lang({
				key: "filderData",
				lang: req.lang
			}),
			data: countData,
			pageLimit: limit,
			pageNo: page
		});
	})
});

router.post('/doctorById', upload.array(), function (req, res) {
	Promise.resolve(patient_web.doctorById(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/practices', upload.array(), function (req, res) {
	Promise.resolve(patient_web.practices(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/feedbacks', upload.array(), function (req, res) {
	Promise.resolve(patient_web.feedbacks(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/articles', upload.array(), function (req, res) {
	Promise.resolve(patient_web.articles(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/hospitalById', upload.array(), function (req, res) {
	Promise.resolve(patient_web.hospitalById(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/searchlist', upload.array(), function (req, res) {
	Promise.resolve(patient_web.searchlist(req))
	.then(result => res.send(result))
	.catch(console.log);
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
