const crypto = require('crypto'),
	log = require('../controllers/log'),
	language = require('../controllers/language'),
	models = require('../models');

models.academicsession.hasMany(models.academicsessiondetail);
models.academicsession.belongsTo(models.institute, {
	foreignKey: 'masterId',
	targetKey: 'userId',
});

const router = require('express').Router();

router.post('/logout', (req, res) => {
	models.parent.update(
		{
			token: null,
		},
		{
			where: {
				token: req.headers.token,
			}
		}
	)
	.then(() => res.send({status: true}))
	.catch(err => res.send(log(req, err)));
});


router.post('/send-otp', (req, res) => {
	res.send({status: true, message: language.lang({key: "OTP sent", lang: req.lang})});
});

router.post('/resend-otp', (req, res) => {
	res.send({status: true, message: language.lang({key: "OTP sent", lang: req.lang})});
});

router.post('/verify-otp', (req, res) => {
	verifyOtp(req.body.mobile, req.body.otp)
	.then(verified => {
		if (!verified)
			return {status: false, message: language.lang({key: "Invalid OTP", lang: req.lang})};
		return models.parent.find({where: {mobile: req.body.mobile}})
		.then(parent => {
			if (parent === null)
				return models.parent.create({
					mobile: req.body.mobile,
					masterId: req.body.masterId,
					token: crypto.randomBytes(32).toString('hex'),
				});
			else {
				parent.token = crypto.randomBytes(32).toString('hex');
				return parent.save();
			}
		})
		.then(parent => ({status: true, parent}));
	})
	.then(res.send.bind(res))
	.catch(err => res.send(log(req, err)))
});


router.use((req, res, next) => {
	models.parent.find({where: {token: req.headers.authorization}})
	.then(parent => {
		req.parent = parent;
		next();
	})
	.catch(err => res.send(log(req, err)));
});

router.post('/', (req, res) => {
	let body = req.body;
	models.academicsession.find({
		where: {
			id: body.academicSessionId,
			admission_open: true,
		},
		include: [
			{
				model: models.academicsessiondetail,
				where: language.buildLanguageQuery(
					{},
					body.langId,
					'`academicsession`.`id`',
					models.institutedetail,
					'academicsessionId'
				)
			},
			{
				model: models.institute,
				include: [
					{
						model: models.institutedetail,
						where: language.buildLanguageQuery(
							{},
							body.langId,
							'`institute`.`id`',
							models.institutedetail,
							'instituteId'
						),
					}
				]
			},
		],
	})
	.then(academicsession => {
		if (academicsession === null) {
			res.send({status: false, code: 'ACADEMIC_SESSION_NOT_FOUND'});
		} else if (req.parent && req.parent.masterId !== academicsession.masterId) {
			res.send({status: false, code: 'INVALID_URL_OF_SESSION'});
		} else {
			res.send({status: true, academicsession, parent: req.parent});
		}
	})
	.catch(err => res.send(log(req, err)));
});

function verifyOtp(mobile, otp) {
	return Promise.resolve(otp === '1234');
}

module.exports = router;
