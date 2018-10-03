'use strict';

const models = require('../models'),
	language = require('./language'),
	mail = require('./mail'),
	notification = require('./notification');

models.complaintrecord.belongsTo(models.complaint);
models.complaint.belongsTo(models.user);
models.user.hasMany(models.userdetail);
models.tag.hasMany(models.tagdetail);

exports.list = function (req) {
	let where = {
		complaintrecord: {
			studentId: req.studentId,
		},
		complaint: {
			academicsessionId: req.academicSessionId,
			masterId: req.masterId
		}
	};

	return Promise.all([
		models.tag.findAll({
			include:[{
				model: models.tagdetail, 
				where: language.buildLanguageQuery(
					{}, 
					req.langId, 
					'`tag`.`id`', 
					models.tagdetail, 
					'tagId'
				), 
				attributes: ['title', 'description']
			}],
			attributes:['id'],
			where: {
				masterId: req.masterId, 
				type: 4, 
				is_active: 1
			},
			order: [['id']]
		}),
		models.complaintrecord.findAll({
			include: [
				{
					model: models.complaint,
					where: where.complaint,
					include:[
						{
							model: models.user,
							attributes: ['id', 'user_type', 'email'],
							include:[
								{
									model: models.userdetail,
									where: language.buildLanguageQuery(
										{}, 
										req.langId, 
										'`complaint.user`.`id`', 
										models.userdetail,
										'userId'
									), 
									attributes: ['fullname']
								}
							]
						}
					]
				},
			],
			where: where.complaintrecord,
			attribute: ['id', 'is_active', 'is_penalty', 'penalty_status'],
			order: [
				['id', 'DESC']
			],
			distinct: true,
			subQuery: false
		})
	])
		.then(([tagData, result]) => ({
			data: result,
			tagsData: tagData,
			status:true,
			message:language.lang({key:"Complaint List", lang:req.lang}),
		}));
};

exports.sendemail = function(req, res) {
	models.student.belongsTo(models.user);
	models.user.hasMany(models.userdetail);
	Promise.all([
		models.student.find({
			include: [{
				model: models.user,
				attributes: ['id', 'email'],
				include:[
					{
						model: models.userdetail,
						where: language.buildLanguageQuery(
							{}, 
							req.langId, 
							'`user`.`id`', 
							models.userdetail,
							'userId'
						), 
						attributes: ['fullname']
					}
				]
			}],
			attributes: ['id'],
			where: {
				id: req.studentId,
				masterId:req.masterId
			}
		})
	]).then(([data]) => {
		mail.sendHtmlMailGeneric('complaintCreatedMailTemplate', req.lang, {
			email: req.emailId,
			subject: language.lang({key: 'Complaint Discussion for ', lang: req.lang})
				+ data.user.userdetails[0].fullname,
			data: {
				complaintId: req.complaintId,
				message: req.message
			}
		});
		res({
			status: true,
			message: language.lang({key:'emailSent', lang: req.lang}),
			data: [] 
		});
	});
};

exports.getById = function (req) {
	return models.complaint.find({
		include:[
			{
				model: models.complaintrecord,
				attributes:['studentId'],
				include: [
					{
						model:models.student, 
						include:[
							{
								model:models.user, 
								include:[
									{
										model: models.userdetail,
										required: false,
										attributes:['id', 'fullname'],
									}
								],
								where:{
									'is_active':1
								},
								required: false,
								attributes:['id', 'mobile'],
							},
							{
								model:models.studentdetail,
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'student.id',
									models.studentdetail,
									'studentId'
								),
								required: false,
								attributes:['id','father_name'],
							}
						],
						attributes: ['id','father_contact', 'enrollment_no'],
						required: false,
					},
				],
				required: false,
			},
		],
		where: {
			id: req.id,
		},
	}).then(function (complaintrecord) {
		if(complaintrecord.tagIds){
			return models.tag.findAll({
				include: [
					{
						model: models.tagdetail, 
						where: language.buildLanguageQuery(
							{}, 
							req.langId, 
							'`tag`.`id`', 
							models.tagdetail, 
							'tagId'
						),
					}
				],
				where: {
					id: {
						$in: complaintrecord.tagIds.split(',')
					},
				},
			})
				.then(function(tags) {
					complaintrecord = complaintrecord.toJSON();
					complaintrecord.tags = tags;
					return complaintrecord;
				});
		} else {
			return complaintrecord;
		}
	});
};


exports.notification = function(req, notiType) {
	return models.sequelize.query(
		"SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` WHERE FIND_IN_SET\
		(`users`.`mobile`,(SELECT GROUP_CONCAT(`father_contact`,','\
		,`father_contact_alternate`,',',`mother_contact`,',',\
		`mother_contact_alternate`,',',`guardian_contact`,',',\
		`guardian_contact_alternate`) FROM `students` WHERE `students`.`id` IN (?)))",
		{
			replacements: [req.studentId],
			type: models.sequelize.QueryTypes.SELECT,
		}
	)
		.then(users => notification.send(
			users,
			'front/notification/complaint/parent',
			{lang: req.lang},
			{
				masterId: req.masterId,
				senderId: req.userId,
				data: {
					type: 'complaint',
				},
			}
		));
};
