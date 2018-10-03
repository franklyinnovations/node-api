var users = require('../../controllers/parents');
var fee = require('../../controllers/fee');
var timetable = require('../../controllers/timetable');
var holiday = require('../../controllers/holiday');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var moment = require('moment');
var upload = multer();
var fs = require('fs');
var async = require('async');
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var studentexamschedule = require('../../controllers/studentexamschedule');
var language = require('../../controllers/language');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var destFolder = tmpDir;
        if (!fs.existsSync(destFolder + file.fieldname)) {
            fs.mkdirSync(destFolder + file.fieldname);
        }
        cb(null, destFolder);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '/' + Date.now() + '.' + mime.extension(file.mimetype));
    }
});
var uploadFile = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            cb('Only image files are allowed!', false);
        } else {
            cb(null, true);
        }
    },
    limits: {fileSize: 1000000}
}).any();



/**
 * @apiVersion 1.0.0
 * @api {post} /admin/parent/verify-otp  Verify OTP
 * @apiGroup Parent
 * @apiName  Parent Verify OTP
 * @apiParam {String} token 
 * @apiParam {String} code
 * @apiParam {String} country_code
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     
 *
 */

router.post('/verify-otp', upload.array(), function (req, res) {

    users.parentLogin(req, function (result) {
        res.send(result);
    });
});


/**
 * @apiVersion 1.0.0
 * @apiGroup Parent
 * @api {post} /admin/parent/verify_mobile  Verify mobile
 * @apiName  Verify mobile
 * @apiParam {String} mobile 
 * @apiParam {String} country_code
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     
 *
 */

router.post('/verify_mobile', upload.array(), function (req, res) {

    users.getByMobile(req, function (result) {
        res.send(result);
    });
});



/**
 * @apiVersion 1.0.0
 * @apiGroup Parent
 * @api {post} /admin/parent/resend-otp  Resend OTP
 * @apiName  Resend OTP
 * @apiParam {String} mobile 
 * @apiParam {String} country_code
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     
 *
 */

router.post('/resend-otp', upload.array(), function (req, res) {

    users.sentOtp(req, function (result) {
        res.send({status: true, message: 'Your message has been sent successfully!', data: result});
    });

});


/**
 * @apiVersion 1.0.0
 * @apiGroup Parent
 * @api {post} /admin/parent/dashboard  Get Dashboard
 * @apiName  Get Dashboard
 * @apiParam {String} user_id 
 * @apiParam {String} langId
 * @apiParam {String} bcsMapId
 * @apiParam {String} academicSessionId
 * @apiParam {String} orderby
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     
 *
 */

router.post('/dashboard', upload.array(), function (req, res) {
    timetable.getTimetableId(req.body, function (result) {
        if (result.status) {
            req.body.id = result.data;
        } else {
            //res.send(result);
        }

        //req.roleAccess = {model:'student', action:'view'};
        //auth.checkPermissions(req, function(isPermission){
        timetable.getById(req.body, function (result) {
            var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            var day = days[ new Date().getDay() ];
            users.dashboard(req, function (dashboardData) {
                res.send({
                    status: true,
                    data: {
                        user: dashboardData[0],
                        schedule: {
                            timetableallocations: result.data ? 
                            result.data.timetableallocations.filter(x => x.weekday == day) : []
                        },
                        fee:{}
                    }
                });                
            });
        });
        //});
    });

});

router.post('/parent_login', upload.array(), function (req, res) {

    users.parentLogin(req, function (result) {
        res.send(result);
    });

});

/**
 * @apiVersion 1.0.0
 * @apiGroup Parent
 * @api {post} /admin/parent/holidays  Get Holidays
 * @apiName  Get Holidays
 * @apiParam {String} user_id 
 * @apiParam {String} langId
 * @apiParam {String} academicSessionId
 * @apiParam {String} masterId
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     
 *
 */

router.post('/holidays', upload.array(), function (req, res) {

    users.getSession(req, function (sessionData) {
        if (1) {
            req.body.start = sessionData[0].start_date;
            req.body.end = sessionData[0].end_date;
        }
        holiday.eventList(req.body, function (result) {
            var op = []
            if (result.events) {
                op = result.events;
            }

            res.send({status: true, messsage: '', data: op});
        });
    });

});


/**
 * @apiVersion 1.0.0
 * @apiGroup Parent
 * @api {post} /admin/parent/ward_list  Ward list
 * @apiName  Ward list
 * @apiParam {String} mobile 
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 "user_image": "public/uploads/user_image/1490764578002.jpeg",
 "userId": 10,
 "institute": "Azzan Bin Qais Private School",
 "class": "1st",
 "fullname": "Imran Ahmad",
 "section": "A",
 "masterId": 3,
 "academicSessionId": 1,
 "bcsMapId": 9,
 "studentId": 2,
 "default_lang": 1,
 "secondary_lang": 2,
 "user_type": "student",
 "userInfo": {
 "default_lang": 1,
 "academicSessions": [
 {
 "id": 2,
 "start_date": "2017-04-01T00:00:00.000Z",
 "end_date": "2018-03-31T00:00:00.000Z",
 "academicsessiondetails": [
 {
 "name": "2017-2018"
 }
 ]
 },
 {
 "id": 1,
 "start_date": "2015-07-01T00:00:00.000Z",
 "end_date": "2017-03-31T00:00:00.000Z",
 "academicsessiondetails": [
 {
 "name": "2016-2017"
 }
 ]
 }
 ],
 "userId": 10,
 "bcsMapId": 9,
 "boardId": 3,
 "classId": 1,
 "user_image": "public/uploads/user_image/1490764578002.jpeg",
 "fullname": "Imran Ahmad"
 },
 "primaryLang": {
 "id": 1,
 "name": "English",
 "code": "en",
 "direction": "lr",
 "is_active": 1,
 "createdAt": "2017-02-16T08:54:51.000Z",
 "updatedAt": "2017-02-22T10:53:32.000Z"
 },
 "languages": [
 {
 "id": 1,
 "name": "English",
 "code": "en",
 "direction": "lr",
 "is_active": 1,
 "createdAt": "2017-02-16T08:54:51.000Z",
 "updatedAt": "2017-02-22T10:53:32.000Z"
 }
 ]
 }    
 *     
 *
 */

router.post('/ward_list', upload.array(), function (req, res) {

    users.wardList(req, function (result) {
        res.send({status: true, message: 'Ward List', data: result});
    });

});

/**
 * @apiVersion 1.0.0
 * @apiGroup Parent
 * @api {post} /admin/parent/isHoliday  isHoliday
 * @apiName  Check Holiday 
 * @apiParam {String} langId
 * @apiParam {String} academicSessionId
 * @apiParam {String} masterId
 * @apiParam {String} date
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     
 *
 */


router.post('/isHoliday', upload.array(), function (req, res) {
    req.body.date = req.body.date;
    holiday.isHoliday(req.body, function (result) {
        var sts = false;
        if (result && result['events'] && result['events'].length) {
            sts = true;
        }
        res.send({status: true, messsage: '', data: result['events']});
    });

});




/**
 * @apiVersion 1.0.0
 * @apiGroup Parent
 * @api {post} /admin/parent/dashboard-list-exam  Dashboard list Exam schedule
 * @apiName  Dashboard list Exam schedule
 * @apiParam {String} user_id 
 * @apiParam {String} langId
 * @apiParam {String} academicSessionId
 * @apiParam {String} masterId
 * @apiParam {String} date
 * @apiParam {String} boardId
 * @apiParam {String} classId
 * @apiParam {String} orderby
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 "id": 27,
 "examScheduleId": 5,
 "masterId": 28,
 "subjectId": 32,
 "date": "2017-11-23T00:00:00.000Z",
 "exam_type": "theory",
 "start_time": "03:05:00",
 "end_time": "15:05:00",
 "duration": "12:00",
 "min_passing_mark": 60,
 "max_mark": 30,
 "examscheduleId": 5,
 "subject": {
 "id": 32,
 "subjectdetails": [
 {
 "id": 32,
 "name": "English"
 }
 ]
 }
 }
 *         
 *     
 *
 */

router.post('/dashboard-list-exam', upload.array(), function (req, res) {

    var data = req.body;
    users.getLastExam(req, function (result) {
        req.body.examheadId = null
        if (result.length) {
            req.body.examheadId = result[0]['examheadId'];
        }
        //req.body.examheadId=result[0]['examheadId'];
        if (typeof req.body.data !== 'undefined') {
            data = JSON.parse(req.body.data);
        }
        studentexamschedule.examSchedule(data, function (result) {
            if (!result.data.length) {
                result.data = [];
            }
            res.send(result);
        });
    });

});


/**
 * @apiVersion 1.0.0
 * @apiGroup Parent
 * @api {post} /admin/parent/dashboard-list-attendance  Dashboard list attendance
 * @apiName  Dashboard list attendance
 * @apiParam {String} langId 
 * @apiParam {String} academicSessionId
 * @apiParam {String} masterId
 * @apiParam {String} studentId
 * @apiParam {String} bcsMapId
 * @apiParam {String} lang
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 "id": 123,
 "date": "2017-06-27T00:00:00.000Z",
 "attendancerecords": [
 {
 "id": 147,
 "is_present": 1,
 "studentId": 1,
 "subjectId": 6,
 "subject": {
 "id": 6,
 "subjectdetails": [
 {
 "id": 6,
 "name": "Sociology"
 }
 ]
 }
 }
 ]
 }    
 *     
 *
 */

router.post('/dashboard-list-attendance', upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    var studentreport = require('../../controllers/studentreport');
    studentreport.getReportByParent(data, function (result) {
        sliceData = [];
        sliceData = result.data.slice(0, 4);
        result.data = sliceData;
        res.send(result);
    });

});



/**
 * @apiVersion 1.0.0
 * @apiGroup Parent
 * @api {post} /admin/parent/dashboard-list-marks  Dashboard list marks
 * @apiName  Dashboard list marks
 * @apiParam {String} langId 
 * @apiParam {String} academicSessionId
 * @apiParam {String} masterId
 * @apiParam {String} studentId
 * @apiParam {String} bcsMapId
 * @apiParam {String} lang
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 "status": true,
 "message": "Exam Schedule",
 "data": [
 {
 "id": 30,
 "masterId": 3,
 "examScheduleId": 4,
 "academicSessionId": 1,
 "bcsMapId": 9,
 "subjectId": 2,
 "date": null,
 "max_mark": 40,
 "min_passing_mark": 20,
 "createdAt": "2017-06-27T05:01:00.000Z",
 "updatedAt": "2017-06-27T05:01:00.000Z",
 "subject_rank": 2,
 "result_is": "0",
 "subject_percent": 12.5,
 "markrecords": [
 {
 "id": 53,
 "markId": 30,
 "studentId": 1,
 "enrollment_no": "654654645",
 "obtained_mark": 5,
 "tags": "39"
 }
 ],
 "subject": {
 "id": 2,
 "subjectdetails": [
 {
 "name": "Business Arabic"
 }
 ]
 }
 }
 ]
 * } 
 *     
 *
 */

router.post('/dashboard-list-marks', upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    var studentMarks = require('../../controllers/studentmark');

    users.getLastScheduleId(req, function (resultSch) {
        if (resultSch.length === 0) return res.send({
            status: true,
            message: "Exam Schedule",
            data: []
        });
        req.body.examScheduleId = resultSch[0]['examScheduleId'];
        studentMarks.getMarksParent(data, function (result) {
            sliceData = [];
            sliceData = result.data.slice(0, 4);
            result.data = sliceData;
            res.send(result);
        });
    });

});




/**
 * @apiVersion 1.0.0
 * @apiGroup Parent
 * @api {post} /admin/studentassignment  Student Assignment
 * @apiName  Student Assignment
 * @apiParam {String} user_id 
 * @apiParam {String} action
 * @apiParam {String} userType
 * @apiParam {String} orderby
 * @apiParam {String} bcsMapId
 * @apiParam {String} lang
 * @apiParam {String} masterId
 * @apiParam {String} academicSessionId
 * @apiParam {String} model
 * @apiParam {String} langId
 * @apiParam {String} params : {page}
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     
 *
 */




/**
 * @apiVersion 1.0.0
 * @apiGroup Parent
 * @api {post} /admin/studentleave/save  Apply Leave
 * @apiName  Apply Leave
 * @apiParam {String} halfday 
 * @apiParam {String} end_date
 * @apiParam {String} tagId
 * @apiParam {String} userId
 * @apiParam {String} start_date
 * @apiParam {String} orderby
 * @apiParam {String} bcsMapId
 * @apiParam {String} lang
 * @apiParam {String} applied_by
 * @apiParam {String} masterId
 * @apiParam {String} duration
 * @apiParam {String} academicSessionId
 * @apiParam {String} langId
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     
 *
 */


router.use(oauth.oauth.errorHandler());
module.exports = router;
