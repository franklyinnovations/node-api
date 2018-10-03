'use strict';

const demo = require('../../controllers/demo'),
log = require('../../controllers/log'),
router = require('express').Router(),
oauth = require('../../config/oauth').oauth,
authorise = oauth.authorise(),
auth = require('../../config/auth'),
language = require('../../controllers/language'),
formData = require('multer')().array();

router.post('/', (req, res) => {
    Promise.resolve(req)
    .then(demo.list)
    .then(result => res.send(result))
    .catch(err => res.send(log(req, err)));
});

router.post('/view', (req, res) => {
    Promise.resolve(req.body)
    .then(demo.view)
    .then(result => res.send(result))
    .catch(err => res.send(log(req, err)));
});

router.use(oauth.errorHandler());
module.exports = router;