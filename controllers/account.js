const models = require('../models'),
	bcrypt = require('bcrypt-nodejs'),
	language = require('./language');

exports.save = req => {
	return Promise.all([
		models.user.build({
			id: req.id,
			email: req.email,
			mobile: req.mobile,
		})
		.validate(),
		models.userdetail.build({
			fullname: req.name,
		})
		.validate(),
	])
	.then(err => {
		if (err[0]) {
			if (err[1]) {
				return err[0].errors.concat(err[1].errors)
			} else {
				return err[0].errors;
			}
		} else if (err[1]) {
			return err[1].errors;
		} else {
			return [];
		}
	})
	.then(errors => {
		if (errors.length !== 0)
			return new Promise(resolve => {
				language.errors(
					{errors, lang: req.lang},
					errors => resolve({status: false, errors})
				);
			});
		return Promise.all([
			models.user.update(
				{
					email: req.email,
					mobile: req.mobile,
					default_lang: req.default_lang
				},
				{
					where: {id: req.id},
					validate: false,
				}
			),
			models.userdetail.find({
				where: {
					languageId: req.langId,
					userId: req.id,
				}
			})
			.then(userdetail => {
				if (userdetail) {
					userdetail.fullname = req.name;
					return userdetail.save();
				} else {
					let userdetailData = userdetail.toJSON();
					delete userdetailData.id;
					userdetailData.languageId = req.langId;
					userdetailData.name = req.name;
					return models.userdetail.create(userdetailData);
				}
			})
		])
		.then(() => ({
			status: true,
			data: {
				name: req.name,
				email: req.email,
				mobile: req.mobile,
				default_lang: req.default_lang
			},
			message: language.lang({key:"updatedSuccessfully",lang:req.lang})
		}))
	});
};

exports.changePassword = req => {
	return models.user.build({
		id: req.id,
		curr_password: req.curr_password,
		new_password: req.new_password,
		confirm_new_password: req.confirm_new_password,
	})
	.validate()
	.then(err => {
		if (err !== null)
			return new Promise(resolve => {
				language.errors(
					{errors: err.errors, lang: req.lang},
					errors => resolve({status: false, errors})
				);
			});
		return models.user.update(
			{
				password: bcrypt.hashSync(req.new_password, null, null)
			},
			{
				where: {id: req.id},
				validate: false,
			}
		)
		.then(() => ({
			status: true,
			message: language.lang({key:"updatedSuccessfully",lang:req.lang})
		}))
	});
};

exports.doctorAppSettings = req => {
	models.user.hasMany(models.userdetail)
	return models.doctorprofile.find({
		include: [
			{
				model: models.onlineconsultsetting,
				attributes: [
					'chat_notification',
					'freeqa_notification',
					'available_for_consult',
				],
			},
			{
				model: models.user,
				attributes: [
					'email',
					'mobile',
					'is_notification',
					'feedback_notification'
				],
				include: [{
					model: models.userdetail,
					attributes: ['fullname'],
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`user`.`id`',
						models.userdetail,
						'userId'
					)
				}]
			},
		],
		where: {
			id: req.doctorprofileId,
		},
		attributes: [],
	})
	.then(data => ({
		status: true,
		data,
		message: language.lang({key:"success",lang:req.lang}),
	}));
}

exports.doctorChangeNotificationSettings = req => {
	var notificationColumns = {available_for_consult: 'available_for_consult', freeqa_notification: 'freeqa_notification', chat_notification: 'chat_notification', feedback_notification: 'feedback_notification'}
	if(req.type === 'all') {
		return models.doctorprofile.find({attributes: ['userId'], where: {id: req.doctorprofileId}}).then(doctordata => {
			return models.user.update({feedback_notification: req.value, is_notification: req.value}, {where: {id: doctordata.userId}}).then(data => {
				return models.onlineconsultsetting.update({
					available_for_consult: req.value, 
					freeqa_notification: req.value, 
					chat_notification: req.value
				}, {where: {doctorprofileId: req.doctorprofileId}}).then(data => ({
					status: true,
					message: language.lang({key:"success",lang:req.lang})
				}))
			})
		})
	} else if(req.type === 'feedback_notification') {
		return models.doctorprofile.find({attributes: ['userId'], where: {id: req.doctorprofileId}}).then(doctordata => {
			return models.user.update({[notificationColumns[req.type]]: req.value}, {where: {id: doctordata.userId}}).then(data => ({
				status: true,
				message: language.lang({key:"success",lang:req.lang})
			}))
		})
	} else {
		return models.onlineconsultsetting.update({[notificationColumns[req.type]]: req.value}, {where: {doctorprofileId: req.doctorprofileId}}).then(data => ({
			status: true,
			message: language.lang({key:"success",lang:req.lang})
		}))
	}
}


