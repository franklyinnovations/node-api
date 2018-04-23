var hospital = require('../controllers/hospital');
var claimrequest = require('../controllers/claimrequest');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var async = require('async');
var oauth = require('../config/oauth');
var auth = require('../config/auth');
var path = require('path'),
crypto = require('crypto');
language = require('../controllers/language');
var models = require('../models');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var destFolder = 'public/uploads/';
        if (!fs.existsSync(destFolder+file.fieldname)) {
            fs.mkdirSync(destFolder+file.fieldname);
        }
        cb(null, destFolder);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname+'/'+Date.now() + '.' + mime.extension(file.mimetype));
    }
});
var uploadFile = multer({
  storage: storage,
	fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            cb(language.lang({key:"Only image files are allowed!",lang:req.body.lang}), false);
        } else {
            cb(null, true);
        }
    },
    limits: {fileSize: 10000000}
}).any();

/* GET list of doctor data */
router.post('/get-profiles', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    
    hospital.getAllProfiles(data, function(result){
        res.send(result);
    });
});

router.post('/meta-data-for-search', oauth.oauth.authorise(), upload.array(), function (req, res) {
    doctor.getMetaDataForSearch(req, function(result) {
        res.send(result);
    })
})

router.post('/check-profile', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    hospital.checkProfile(data, function(result) {
        res.send(result);
    });
});

router.post('/new-profile', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    
    hospital.metaDataForNewProfile(data, function(result) {
        res.send(result);
    })
})

router.post('/save-basic-info', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        if (err) {
            
            if (err.code === 'LIMIT_FILE_SIZE') err = language.lang({key:"Image size should less than 10 MB",lang:req.body.lang});
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if(typeof req.body.data !== 'undefined'){
              data = JSON.parse(req.body.data);
            }

            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !=='') {
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                hospital.save(data, function(result) {
                    res.send(result);
                })
            });
        }
    })
})

router.post("/send-claim-request", oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    claimrequest.clinicClaimRequest(data, function(result) {
        res.send(result);
    })
})
router.post("/cancel-claim-request", oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    claimrequest.hospitalCancelClaimRequest(data, function(result) {
        res.send(result);
    })
})

router.post('/shiftstatus/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    data.shift_24X7 = req.params.status;
    hospital.shiftstatus(data, function(result){
        res.send(result);
    });
});

router.post('/managefreeze/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    data.is_freeze = req.params.status;
    hospital.managefreeze(data, function(result){
        res.send(result);
    });
});

router.post('/save-time', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }

    let timings = data.timings;
    hospital.save_time(data, function(result){
        res.send(result);
    });
});

router.post('/filter_doctor', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }

    hospital.filter_doctor(data, function(result){
        res.send(result);
    });
});

router.post('/save_doctor_time', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }

    hospital.save_doctor_time(data, function(result){
        res.send(result);
    });
});

router.post('/check-clinic-profile-status', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }

    hospital.updateProfileStatusWhileUpdate(data, function(result){
        res.send(result);
    });
});
/**
 * @api {post} /hospital/hospitalById Get hospital profile
 * @apiName hospitalById
 * @apiGroup Hospital
 *
 * @apiParam {integer} id required here id is hospital id
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post('/hospitalById', /*oauth.oauth.authorise(),*/ function (req, res) {

    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    hospital.hospitalById(data, function (result) {
        res.send({status:true, message:'', data:result});
    });
});

router.post('/create-by-doctor', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 1 MB';
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if(typeof req.body.data !== 'undefined'){
              data = JSON.parse(req.body.data);
            }

            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !=='') {
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                hospital.createByDoctor(data, function(result) {
                    res.send(result);
                })
            });
        }
    })
})

router.post('/meta-data-for-add', oauth.oauth.authorise(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    hospital.metaDataForNewProfile(data, function(result) {
        res.send(result);
    })
})

router.post('/create-by-doctor', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 1 MB';
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if(typeof req.body.data !== 'undefined'){
              data = JSON.parse(req.body.data);
            }

            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !=='') {
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                hospital.createByDoctor(data, function(result) {
                    res.send(result);
                })
            });
        }
    })
})

router.post('/edit-profile/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    hospital.getProfileForDoctor(data, function(result){
        res.send(result);
    });
});
router.post('/getEditMetaData', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    hospital.metaDataForEditProfile(data, function(result) {
        res.send(result);
    })
})

router.post('/view-hospital-info', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    hospital.viewHospitalInfo(data, function(result){
        res.send(result);
    });
})

router.post('/unmapdoc', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }

    models.hospital.unmapdoc(data, function(result){
        res.send(result);
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
