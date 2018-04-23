const transaction = require('../../controllers/transaction'),
	oauth = require('../../config/oauth'),
	router = require('express').Router();

router.post('/duetransactions', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req)
	.then(transaction.listForAdmin)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/paidtransactions', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req)
	.then(transaction.listForAdminPaid)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/viewDetails', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(transaction.viewDetails)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/viewACDetails', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(transaction.viewACDetails)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/releasePayment', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(transaction.releasePayment)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/viewPaidDetail', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(transaction.viewPaidDetail)
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /admin/transaction/client_token Client Token
 * @apiName Client Token
 * @apiGroup Chat Payment
 */
router.post('/client_token', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(transaction.clientToken)
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /admin/transaction/checkout Chat payment checkout
 * @apiName Chat payment checkout
 * @apiGroup Chat Payment
 * @apiParam {integer} chatconsultId required
 * @apiParam {integer} amount required
 * @apiParam {string} nonce required
 */
router.post('/checkout', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(transaction.checkout)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/invoice', (req, res) => {
	Promise.resolve(req.body)
	.then(transaction.invoice)
	.then(result => res.send(result.html))
	.catch(console.log);
});

router.use(oauth.oauth.errorHandler());
module.exports = router;