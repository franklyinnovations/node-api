var users = require('../controllers/users');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname+Date.now() + '.' + mime.extension(file.mimetype));
    }
});
var uploadFile = multer({
  storage: storage,
	fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
		cb('Only image files are allowed!', false);
    }
    cb(null, true);
  },
  limits: {fileSize: 1000000}
}).any();



/* GET users listing. */
router.post('/login', function (req, res, next) {
    uploadFile(req, res, function (err) {
        res.send({'user':'test'});
    });
});


/* GET users listing. */
router.get('/register', function(req, res, next) {
  res.render('user/register', {cooks: req.cookies});
});

/* GET users listing. */
router.post('/register/add',  upload.array(), function(req, res, next) {
  users.save(req, function(data){
    res.redirect('/users/register');
  });
  
  //users.list(req, function(data){
  //  console.log(data);
  //  res.redirect('/users/register');
  //});
  
});

module.exports = router;
