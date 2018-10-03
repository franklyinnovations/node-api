'use strict';

const
	pdf = require('html-pdf'),
	moment = require('moment'),
	feesubmission = require('../../controllers/feesubmission'),
	log = require('../../controllers/log'),
	router = require('express').Router(),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	mail = require('../../controllers/mail'),
	language = require('../../controllers/language'),
	auth = require('../../config/auth');


router.post('/students', authorise, (req, res) => {
	req.roleAccess = {model:'feesubmission', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(feesubmission.students)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/fee-allocations', authorise, (req, res) => {
	req.roleAccess = {model:'feesubmission', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(feesubmission.feeallocations)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/pay', authorise, (req, res) => {
	req.roleAccess = {model:'feesubmission', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(feesubmission.pay)
				.then(data => res.send(data))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.get('/:id/invoice.pdf', authorise, (req, res) => {
	req.roleAccess = {model:'feesubmission', action:'view'};
	auth.checkPermissions(req, async isPermission => {
		if (isPermission.status === true) {
			let data;
			try {
				data = await feesubmission.getById({feesubmissionId: req.params.id, ...req.query});
			} catch (err) {
				res.send(log(req, err));
				return;
			}
			data.moment = moment;
			data.dir = req.query.dir === 'rl' ? 'rtl' : 'ltr';
			req.app.render(
				'front/invoice/invoice',
				language.bindLocale(data, req.query.lang),
				(err, html) => {
					if (err) {
						res.send(log(req, err));
					} else {
						pdf.create(html)
							.toStream((err, stream) => {
								if (err) {
									res.send(log(req, err));
								} else {
									res.setHeader('content-type', 'application/pdf');
									stream.pipe(res);
								}
							});
					}
				}
			);
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/send-invoice', authorise, (req, res) => {
	req.roleAccess = {model:'feesubmission', action:'view'};
	auth.checkPermissions(req, async isPermission => {
		if (isPermission.status === true) {
			let data = await feesubmission.getById(req.body);
			data.moment = moment;
			data.dir = req.query.dir === 'rl' ? 'rtl' : 'ltr';
			data.email = true;
			req.app.render(
				'front/invoice/invoice',
				language.bindLocale(data, req.body.lang),
				(err, html) => {
					if (err) {
						res.send(log(req, err));
					} else {
						pdf.create(html)
							.toBuffer((err, buffer) => {
								if (err) {
									res.send(log(req, err));
								} else {
									mail.sendMail({
										email: req.body.email,
										subject: language.lang({key:'subjectInvoice',lang: req.body.lang}),
										msg: language.lang({key:'Dear',lang: req.body.lang}) + language.lang({key:'mailInvoice',lang: req.body.lang}),
										attachments: [{
											filename: 'invoice.pdf',
											content: buffer.toString('base64'),
										}],
									});
									res.send({
										status: true,
										message: language.__(
											'emailSent',
											req.body.lang,
										),
									});
								}
							});
					}
				}
			);
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;