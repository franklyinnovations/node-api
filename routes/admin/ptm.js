var empleavetype = require('../../controllers/ptm');

var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'empleavetype', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            empleavetype.list(req, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* save  */
router.post('/save', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'empleavetype', action:['add', 'edit']};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            empleavetype.save(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* add */
router.post('/add', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'empleavetype', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            res.send(data);
        } else {
            res.send(isPermission);
        }
    });
});

/* edit  */
router.post('/edit/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    req.roleAccess = {model:'empleavetype', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            empleavetype.getById(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* status  */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    data.is_active = req.params.status;
    req.roleAccess = {model:'empleavetype', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            empleavetype.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* getAllSections */
router.post('/list/:id', upload.array(), function (req, res) {
    var data = JSON.parse(req.body.data);
    data.id = req.params.id;
    empleavetype.getAllSection(data, function(result){
        res.send(result);
    });
});



/* get ptm avb teachers list */
router.post('/ptm-teacher', upload.array(), function (req, res) {
    
    //var data = JSON.parse(req.body.data);
    //data.id = req.params.id;
    empleavetype.getPtmTeacher(req, function(result){
        res.send({status:true,message:'',data:result});
        
    });
    
});



router.post('/add-ptm', upload.array(), function (req, res) {
    
    //var data = JSON.parse(req.body.data);
    //data.id = req.params.id;
    empleavetype.addPtm(req, function(result){
        res.send(result);
    });
    
});



router.post('/update-time', upload.array(), function (req, res) {
    
    //var data = JSON.parse(req.body.data);
    //data.id = req.params.id;
    empleavetype.updateTime(req, function(result){
        res.send(result);
    });
    
    
});


router.post('/get-time', upload.array(), function (req, res) {
    
    //var data = JSON.parse(req.body.data);
    //data.id = req.params.id;
    empleavetype.getTime(req, function(result){
        res.send({status:true,message:'',data:result});
    });
    
    
});

router.post('/get-ptm-invite', upload.array(), function (req, res) {
    
    //var data = JSON.parse(req.body.data);
    //data.id = req.params.id;
    empleavetype.getPtmInvite(req, function(result){
        res.send({status:true,message:'',data:result});
    });
    
    
});

router.post('/mark-sheet', upload.array(), function (req, res) {
    
    //var data = JSON.parse(req.body.data);
    //data.id = req.params.id;
    empleavetype.markSheetAll(req, function(result){
        res.send({status:true,message:'',data:result});
    });
    
    
});


router.post('/mark-sheet/:id', upload.array(), function (req, res) {
    
    //console.log('/mark-sheet/:id');
    //console.log(req.body);
    //var data = JSON.parse(req.body.data);
    //data.id = req.params.id;
    empleavetype.markSheetAll(req, function(result){
        
        //console.log(result);
        
        res.send({status:true,message:'',data:result});
    });
    
    
});


router.post('/mark-sheet/:id/:masterId', upload.array(), function (req, res) {
    
    //console.log('/mark-sheet/:id');
    //console.log(req.body);
    //var data = JSON.parse(req.body.data);
    //data.id = req.params.id;
    empleavetype.markSheetAll(req, function(result){
        res.send({status:true,message:'',data:result});
    });
    
    
});

router.get('/mark-sheet-all', upload.array(), function (req, res) {
    
    //var data = JSON.parse(req.body.data);
    //data.id = req.params.id;
    empleavetype.markSheetAll(req, function(result){
        //res.send({status:true,message:'',data:result});
        res.send(result);
    });
        
});

router.get('/mark-sheet-data', upload.array(), function (req, res) {
    
    //var data = JSON.parse(req.body.data);
    //data.id = req.params.id;
    empleavetype.markSheetAll(req, function(result){
        //res.send({status:true,message:'',data:result});
        res.send(result);
    });
    
    
});











router.use(oauth.oauth.errorHandler());
module.exports = router;
