'use strict';

const models = require('../models'),
language = require('./language'),
utils = require('./utils'),
mail = require('./mail'),
tagtype = require('./tagtype');;


models.doctorprofile.hasMany(models.doctorprofiledetail, {as: 'doctorprofiledetails'});
models.doctorprofile.hasMany(models.doctorfile);
models.doctorprofile.hasMany(models.doctoreducation, {as: 'doctoreducations'});
models.doctorprofile.hasMany(models.hospital_doctors, {as: 'hospital_doctors'});
models.doctorprofile.hasMany(models.doctortags, {as: 'doctortags'});
models.doctorprofile.belongsTo(models.city);

models.doctortags.belongsTo(models.tag,{foreignKey:'tagId'});

models.doctoreducation.hasMany(models.doctoreducationdetail);
models.doctoreducation.belongsTo(models.tag, {foreignKey: 'tagtypeId'});

models.doctorregistration.hasMany(models.doctorregistrationdetail, {foreignKey: 'doctorRegistrationId'});
models.doctorexperience.hasMany(models.doctorexperiencedetail, {foreignKey: 'doctorExperienceId'});
models.doctoraward.hasMany(models.doctorawarddetail, {foreignKey: 'doctorAwardId'});

models.hospital_doctors.belongsTo(models.hospital, {as:'hospital'});
models.hospital_doctors.hasMany(models.hospital_doctor_timings);

models.hospital.hasMany(models.hospitaldetail);
models.hospital.hasMany(models.contactinformation, {
	foreignKey: 'key',
	sourceKey: 'id'
});
models.hospital.hasMany(models.hospitalfile);
models.hospital.belongsTo(models.city);
models.hospital.belongsTo(models.state);
models.hospital.belongsTo(models.country);

models.city.hasMany(models.citydetail);
models.city.belongsTo(models.state);

models.state.hasMany(models.statedetail);
models.state.hasMany(models.statedetail);

models.country.hasMany(models.countrydetail);

models.doctorfeedback.belongsTo(models.patient);
models.patient.belongsTo(models.user);

models.article.hasMany(models.articledetail);
models.article.belongsTo(models.doctorprofile, {foreignKey: 'keyId'});

models.user.hasMany(models.userdetail);
models.user.hasOne(models.doctorprofile, {foreignKey: 'userId', as: 's_doctorprofile'});
models.user.hasOne(models.hospital, {foreignKey: 'userId', as: 's_hospital'});

exports.getCitiesByCountryId = function (req) {
	var isWhere = {};
	isWhere.citydetail = language.buildLanguageQuery(
		isWhere.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId'
	);
	isWhere.statedetail = language.buildLanguageQuery(
		isWhere.statedetail, req.langId, '`state`.`id`', models.statedetail, 'stateId'
	);
	return models.city.findAll({
		include: [
			{
				model: models.citydetail,
				where:isWhere.citydetail
			}, {
				model: models.state,
				attributes: ['id'],
				include: [{
					model: models.statedetail,
					attributes: ['name'],
					where: isWhere.statedetail
				}]
			}
		],
		where:{
			is_active:1,
			countryId:req.countryId
		},
		order: [
			[models.citydetail, 'name', 'ASC']
		]
	}).then(data => ({data}))
};

exports.doctorById = req => {
	return Promise.all([
		models.doctorprofile.find({
			attributes: [
				'id',
				'userId',
				'mobile',
				'email',
				'salutation',
				'doctor_profile_pic',
				'latitude',
				'longitude',
				[models.sequelize.literal('(SELECT (MAX(duration_to)-MIN(duration_from)) FROM doctor_experiences WHERE doctor_experiences.doctorProfileId = doctorprofile.id)'), 'total_exp'],
				[models.sequelize.literal('(SELECT ROUND(AVG(doctor_feedbacks.rating)) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id)'), 'avg_rating'],
				[models.sequelize.literal('(SELECT COUNT(`doctor_feedbacks`.`id`) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id AND doctor_feedbacks.is_approved=1)'), 'feedbacks'],
				[
					models.sequelize.literal(getMappedHospitalInfo('`hospital_details`.`hospital_name`', req.langId)),'h_hospital_name',
				],
				[
					models.sequelize.literal(
						getMappedHospitalInfo('`hospital_doctors`.`consultation_charge`', req.langId)
					),
					'consultation_charge',
				],
			],
			include: [{
				model: models.doctorprofiledetail,
				as: 'doctorprofiledetails',
				attributes: ['about_doctor', 'address_line_1', 'name'],
				where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
			}, {
				model: models.doctorfile,
				attributes: ['document_type', 'doctor_files', 'original_name', 'file_type'],
				required: false
			}, {
				model: models.doctoreducation,
				attributes: ['id', 'tagtypeId'],
				include: [{
					model: models.doctoreducationdetail,
					attributes: ['college_name'],
					where: language.buildLanguageQuery({}, req.langId, '`doctoreducation`.`id`', models.doctoreducationdetail, 'doctorEducationId'),
					required: false
				}, {
					model: models.tag,
					attributes: ['id'],
					required: false,
					include: [{
						model: models.tagdetail,
						attributes: ['title'],
						where: language.buildLanguageQuery({}, req.langId, '`doctoreducation.tag`.`id`', models.tagdetail, 'tagId'),
						required: false
					}]
				}],
				required: false
			}],
			where: {
				id: req.id,
				is_active: 1,
				is_live: 1
			}
		}),
		models.doctortags.findAll({
			attributes: ['tagId'],
			where: {
				doctorProfileId: req.id
			}
		}),
		models.doctorregistration.findAll({
			attributes: ['council_registration_number', 'year_of_registration'],
			include: [{
				model: models.doctorregistrationdetail,
				attributes: ['council_name'],
				where: language.buildLanguageQuery({}, req.langId, '`doctorregistration`.`id`', models.doctorregistrationdetail, 'doctorRegistrationId'),
			}],
			where: {
				doctorProfileId: req.id
			}
		}),
		models.doctorexperience.findAll({
			attributes: ['designation', 'duration_from', 'duration_to'],
			include: [{
				model: models.doctorexperiencedetail,
				attributes: ['clinic_hospital_name', 'city_name'],
				where: language.buildLanguageQuery({}, req.langId, '`doctorexperience`.`id`', models.doctorexperiencedetail, 'doctorExperienceId'),
			}],
			where: {
				doctorProfileId: req.id
			}
		}),
		models.doctoraward.findAll({
			attributes: ['award_year'],
			include: [{
				model: models.doctorawarddetail,
				attributes: ['award_gratitude_title'],
				where: language.buildLanguageQuery({}, req.langId, '`doctoraward`.`id`', models.doctorawarddetail, 'doctorAwardId'),
			}],
			where: {
				doctorProfileId: req.id
			}
		})
	]).then(([info, doctortags, registrations, experiences, awards]) => {
		let arrtag = doctortags.map(item => item.tagId);
		if (info) {
			info = JSON.parse(JSON.stringify(info));
		}
		info.registrations = registrations;
		info.experiences = experiences;
		info.awards = awards;
		return Promise.all([
			tagtype.listByTypeAndTagsNew({
				body: {
					id: 2,
					tagIDS: arrtag
				}
			}),
			tagtype.listByTypeAndTagsNew({
				body: {
					id: 1,
					tagIDS: arrtag
				}
			}),
			tagtype.listByTypeAndTagsNew({
				body: {
					id: 12,
					tagIDS: arrtag
				}
			}),
		]).then(([specializations, services, memberships]) =>{
			if(specializations){
				info.specializations = specializations.tags;
			}
			if(services){
				info.services = services.tags;
			}
			if(memberships){
				info.memberships = memberships.tags;
			}
			return {
				info
			}
		});
	});
};

function getMappedHospitalInfo(column, langId){
	return '(SELECT '+column+' FROM `hospital_details` INNER JOIN `hospital_doctors`'
	+' ON `hospital_doctors`.`hospitalId` = `hospital_details`.`hospitalId`'
	+' WHERE `hospital_doctors`.`doctorProfileId` = `doctorprofile`.`id`'
	+' AND `hospital_details`.`languageId`= IFNULL((SELECT `languageId` FROM `hospital_details`'
	+' WHERE `hospital_doctors`.`hospitalId` = `hospital_details`.`hospitalId`'
	+' AND `hospital_details`.`languageId`='+langId+'),1) LIMIT 1)';
};

exports.practices = req => {
	return models.hospital_doctors.findAll({
		include: [{
			model: models.hospital_doctor_timings,
			attributes: [
				[
					models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
						), "%h:%i %p"
					),
					'shift_1_from_time'
				],
				[
					models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
						), "%h:%i %p"
					), 'shift_1_to_time'
				],
				[
					models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
						), "%h:%i %p"
					),
					'shift_2_from_time'
				],
				[
					models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
						), "%h:%i %p"
					),
					'shift_2_to_time'
				],
				'days'
			],
			required: false
		}, {
			model: models.hospital,
			attributes: ['hospital_logo'],
			include: [{
				model: models.hospitaldetail,
				attributes: ['about_hospital', 'address', 'hospital_name', 'contact_emails', 'contact_mobiles'],
				where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.doctorprofiledetail, 'hospitalId')
			}, {
				model: models.contactinformation,
				where: {
					model: 'hospital'
				},
				required: false,
				attributes: ["type", "value"]
			}, {
				model: models.hospitalfile,
				attributes: ['file_type', 'document_type', 'hospital_files', 'original_name'],
				where: {
					document_type: 'public_photos',
					is_active: 1
				},
				required: false
			}, {
				model: models.city,
				attributes: ['id'],
				include: [{
					model: models.citydetail,
					attributes: ['name'],
					where: language.buildLanguageQuery({}, req.langId, '`hospital.city`.`id`', models.citydetail, 'cityId')
				}]
			}, {
				model: models.state,
				attributes: ['id'],
				include: [{
					model: models.statedetail,
					attributes: ['name'],
					where: language.buildLanguageQuery({}, req.langId, '`hospital.state`.`id`', models.citydetail, 'stateId')
				}]
			}, {
				model: models.country,
				attributes: ['id'],
				include: [{
					model: models.countrydetail,
					attributes: ['name'],
					where: language.buildLanguageQuery({}, req.langId, '`hospital.country`.`id`', models.countrydetail, 'countryId')
				}]
			}]
		}],
		attributes: ['id', 'consultation_charge'],
		where: {
			doctorProfileId: req.id
		}
	}).then(data => ({data}));
};

exports.feedbacks = req => {
	return models.doctorfeedback.findAll({	
		attributes: ['id', 'rating', 'feedback', 'createdAt'],
		include: [{
			model: models.patient,
			attributes: ['id'],
			include: [{
				model: models.user,
				attributes: ['id', 'user_image'],
				include: [{
					model: models.userdetail,
					attributes: ['fullname'],
					where: language.buildLanguageQuery({}, req.langId, '`patient.user`.`id`', models.userdetail, 'userId')
				}]
			}]
		}],
		where: {
			doctorProfileId: req.id,
			is_approved: 1
		}
	}).then(data => ({data}));
};

exports.articles = req => {
	return models.article.findAll({	
		attributes: ['id', 'article_tags', 'article_image'],
		include: [{
			model: models.articledetail,
			attributes: ['title', 'body'],
			where: language.buildLanguageQuery({}, req.langId, '`article`.`id`', models.userdetail, 'articleId')
		}, {
			model: models.doctorprofile,
			attributes: ['id', 'salutation'],
			include: [{
				model: models.doctorprofiledetail,
				as: 'doctorprofiledetails',
				attributes: ['name'],
				where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.userdetail, 'doctorProfileId')
			}]
		}],
		where: {
			keyId: req.id,
			is_active: 1,
			status: 1
		}
	}).then(data => ({data}));
};

exports.hospitalById = req => {
	return Promise.all([
		models.hospital.find({
		})
	]).then(info => {
		return {
			info
		}
	})
};

exports.searchlist = req => {
	let pageSize = req.app.locals.site.page;
	req = req.body;
	let	page = req.page || 1;

	let whereHospital = {},
		isCondition = {
			status:1
		};

	if('undefined'!==typeof req.online_booking){
		whereHospital = {
			active_schedule:1
		};
	}

	if('undefined'!==typeof req.consultation_charge && 'undefined'!==typeof req.online_booking){
		whereHospital = {
			active_schedule:1
		};

		let feeArray = req.consultation_charge.split("-");
		isCondition.consultation_charge = {$between:feeArray};
		isCondition.available_on_req = 0;
	}

	if('undefined'!==typeof req.consultation_charge){
		let feeArray = req.consultation_charge.split("-");
		isCondition.consultation_charge = {$between:feeArray};
	}

	return models.user.findAndCountAll({
		attributes: ['id', 'user_type'],
		include: [{
			model: models.doctorprofile,
			as: 's_doctorprofile',
			attributes: [
				'id',
				'doctor_profile_pic',
				'salutation',
				'gender',
				[
					models.sequelize.literal(
						'(SELECT (MAX(`duration_to`)-MIN(`duration_from`)) FROM `doctor_experiences` WHERE `doctor_experiences`.`doctorProfileId` = `s_doctorprofile`.`id`)'
					),'total_exp'
				],
				[
					models.sequelize.literal(
						'(SELECT IFNULL(ROUND(AVG(`doctor_feedbacks`.`rating`)),0) FROM `doctor_feedbacks` WHERE `doctor_feedbacks`.`doctorProfileId` = `s_doctorprofile`.`id`)'
					), 'avg_rating'
				],
			],
			required: false,
			include: [{
				model: models.doctorprofiledetail,
				as: 'doctorprofiledetails',
				attributes: ['name'],
				required: false,
				where: language.buildLanguageQuery(
					{}, req.langId, '`s_doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'
				)
			}, {
				model: models.hospital_doctors,
				required: false,
				as: 'hospital_doctors',
				attributes:[
					'consultation_charge',
					'available_on_req',
					'id'
				],
				where:isCondition,
				include:[{
					model: models.hospital,
					as: 'hospital',
					required: false,
					attributes:['id','active_schedule'],
					include:[{
						model:models.hospitaldetail,
						attributes:['hospital_name'],
						required: false
					}, {
						model: models.contactinformation,
						attributes:['value'],
						where:{
							type:'mobile',
							is_primary:1
						},
						required: false
					}],
					where: whereHospital
				}]	  
			}, {
				model: models.doctoreducation,
				attributes: ['tagtypeId'],
				as: 'doctoreducations',
				include: [{
						model: models.tag,
						attributes: ['id'],
						required: false,
						include: [{
							model: models.tagdetail,
							attributes: ['title'],
							required: false,
							where: language.buildLanguageQuery({}, req.langId, '`s_doctorprofile.tag`.`id`', models.tagdetail, 'tagId')
						}]
					},

				],
				required: false
			}, {
				model: models.doctortags,
				as: 'doctortags',
				attributes: ['tagId'],
				required: false,
				include: [{
					model: models.tag,
					attributes: ['id'],
					required: false,
					where: {
						tagtypeId: 2
					},
					include: [{
						model: models.tagdetail,
						attributes: ['title'],
						required: false,
						where: language.buildLanguageQuery(
							{}, req.langId, '`s_doctorprofile.doctortags.tag`.`id`', models.tagdetail, 'tagId'
						)
					}]
				}],
			}, {
				model: models.doctorfile,
				attributes: ['doctor_files'],
				required: false,
				where: {
					document_type: 'public_photos',
					file_type: 'image'
				}
			}, {
				model: models.city,
				attributes: ['id'],
				required: false,
				include: [{
					model: models.citydetail,
					attributes: ['name'],
					required: false,
					where: language.buildLanguageQuery({}, req.langId, '`s_doctorprofile.city`.`id`', models.citydetail, 'cityId')
				}],
			}],
			where: {
				is_live: 1,
				is_active: 1,
				cityId: req.cityId,
				tagId: models.sequelize.literal(
					'((SELECT COUNT("doctorProfileId") FROM `doctor_tags` WHERE `doctor_tags`.`doctorProfileId` = `s_doctorprofile`.`id`'+
					' AND `doctor_tags`.`tagId` = '+req.tagId+') != 0)'
				)
			}
		}, {
			model: models.hospital,
			as: 's_hospital',
			attributes: [
				'id',
				'hospital_logo',
				'zipcode',
				'is_live',
				'is_active',
				[
					models.sequelize.literal(
						'(SELECT IFNULL(ROUND(AVG(`doctor_feedbacks`.`rating`)),0) FROM `doctor_feedbacks` WHERE `doctor_feedbacks`.`hospitalId` = `s_hospital`.`id`)'
					),
					'avg_rating'
				]
			],
			include: [{
				model: models.hospitaldetail,
				attributes: ['hospital_name', 'address'],
				required: false,
				where: language.buildLanguageQuery(
					{}, req.langId, '`s_hospital`.`id`', models.hospitaldetail, 'hospitalId'
				)
			}, {
				model: models.hospitalfile,
				attributes: ['hospital_files'],
				where: {
					document_type: 'public_photos',
					file_type: 'image'
				},
				required: false
			}, {
				model: models.city,
				attributes: ['id'],
				include: [{
					model: models.citydetail,
					attributes: ['name'],
					required: false,
					where: language.buildLanguageQuery({}, req.langId, '`hospital.city`.`id`', models.citydetail, 'cityId')
				}],
				required: false
			}, {
				model: models.state,
				attributes: ['id'],
				include: [{
					model: models.statedetail,
					attributes: ['name'],
					required: false,
					where: language.buildLanguageQuery({}, req.langId, '`hospital.state`.`id`', models.statedetail, 'stateId')
				}],
				required: false
			}, {
				model: models.country,
				attributes: ['id'],
				include: [{
					model: models.countrydetail,
					attributes: ['name'],
					required: false,
					where: language.buildLanguageQuery({}, req.langId, '`hospital.country`.`id`', models.countrydetail, 'countryId')
				}],
				required: false
			}, {
				model: models.contactinformation,
				attributes: ['value'],
				where: {
					type: 'mobile',
					is_primary: 1
				},
				required: false
			}],
			required: false,
			where: {
				is_live: 1,
				is_active: 1,
				cityId: req.cityId,
				tagId: models.sequelize.literal(
					'((SELECT COUNT("hospitalId") FROM `hospital_services` WHERE `hospital_services`.`hospitalId` = `s_hospital`.`id`'+
					' AND `hospital_services`.`tagId` = '+req.tagId+') != 0)'
				)
			}
		}],
		where: {
			user_type: {$in:['hospital', 'doctor', 'doctor_clinic_both']},
			check: models.sequelize.literal('( CASE WHEN (`user_type`= "doctor_clinic_both") THEN `s_hospital`.`id` IS NOT NULL AND `s_doctorprofile`.`id` IS NOT NULL ELSE `s_hospital`.`id` IS NOT NULL OR `s_doctorprofile`.`id` IS NOT NULL END)')
		},
		order: [
			[
				{
					model: models.doctorprofile,
					as: 's_doctorprofile'
				},
				{
					model: models.hospital_doctors,
					as: 'hospital_doctors'
				},
				'id',
				'DESC'
			]
		],
		//group:['user.id'],
		distinct: true,
		/*limit: pageSize,
		offset: (page - 1) * pageSize,*/
		subQuery: false
	}).then(data => {
		return {
			status: true,
			data: data.rows,
			totalData: data.count.length,
			pageCount: Math.ceil(data.count.length / pageSize),
			pageLimit: pageSize,
			currentPage: parseInt(page)
		}
	})
};
