const chat = require('../../controllers/chat'),
	oauth = require('../../config/oauth'),
	transaction = require('../../controllers/transaction'),
	router = require('express').Router();

router.post('/list', (req, res) => {
	req.body.pageSize = req.app.locals.site.page;
	Promise.resolve(req.body)
	.then(chat.list)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/consult', (req, res) => {
	Promise.resolve(req.body)
	.then(chat.getByIdForDoctor)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/transactions', (req, res) => {
	req.body.pageSize = req.app.locals.site.page;
	Promise.resolve(req.body)
	.then(transaction.listForDoctor)
	.then(result => res.send(result))
	.catch(console.log);
});

router.use(oauth.oauth.errorHandler());
module.exports = router;