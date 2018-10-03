'use strict';

const models = require('../models'),
	moment = require('moment'),
	language = require('./language');

models.studentrecord.belongsTo(models.student);
models.student.hasMany(models.studentdetail);
models.student.belongsTo(models.user);
models.user.hasMany(models.userdetail);

exports.getStudents = function (req) {
	return Promise.all([
		models.studentrecord.scope(
			{ method: ['transferred', moment().format('YYYY-MM-DD')]},
			{ method: ['tc', '"'+moment().format('YYYY-MM-DD')+'"', req.academicSessionId]}
		).findAll({
			include: [
				{
					model: models.student,
					attributes: [
						'id',
						'enrollment_no',
						'form_no',
						'fee_receipt_no',
						'doa',
						'dob',
						'blood_group',
						'gender',
						'res_category',
						'aadhar',
						'father_contact',
						'father_contact_alternate',
						'mother_contact',
						'mother_contact_alternate',
						'guardian_contact',
						'guardian_contact_alternate',
						'father_email',
						'mother_email',
						'no_of_brother',
						'no_of_sister',
						'no_of_brother_in_school',
						'no_of_sister_in_school',
						'rank_in_family',
						'residancy_number',
						'rn_issuer',
						'date_of_release',
						'date_of_expiration'
					],
					include: [
						{
							model: models.studentdetail,
							attributes: [
								'id',
								'father_name',
								'mother_name',
								'guardian_name',
								'guardian_relationship',
								'guardian_address',
								'birthmark',
								'height',
								'address',
								'address_2',
								'birthplace',
								'religion',
								'nationality',
								'pre_school_name',
								'pre_school_address',
								'pre_qualification',
								'weight',
								'birthplace',
								'father_occupation',
								'mother_occupation',
								'standard_of_living',
								'health_issue_detail',
								'allergies_detail',
								'medicine_detail',
								'asthma_detail',
								'disability_detail'
							],
							where: language.buildLanguageQuery(
								{},
								req.langId,
								'`student`.`id`',
								models.studentdetail,
								'studentId'
							)
						},{
							model: models.user,
							attributes: [
								'id',
								'mobile',
								'email',
								'alternate_mobile'
							],
							include: [
								{
									model: models.userdetail,
									attributes: ['id','fullname'],
									where: language.buildLanguageQuery(
										{},
										req.langId,
										'`student.user`.`id`',
										models.userdetail,
										'userId'
									)
								}
							],
						}
					],
				}
			],
			where: {
				bcsMapId: req.bcsmapId,
				masterId: req.masterId,
				academicSessionId: req.academicSessionId,
				/*record_status: 1,
				$or: [
				  {transferred: 0},
				  {transferred: 1, transerred_effective_from: {$gt:moment().format('YYYY-MM-DD')}},
				  {transferred: 2, transerred_effective_from: {$lte:moment().format('YYYY-MM-DD')}}
				],*/
			},
			order: [
				['roll_no'],
				['id', 'DESC']
			],
			attributes: ['id', 'roll_no'],
		})
	])
		.then(([data])=> ({status: true, data}));
};

exports.saveEdit = function (req) {
	req.student.forEach(student => {
		student.date_of_release = student.date_of_release || null;
		student.date_of_expiration = student.date_of_expiration || null;
	});
	return Promise.all([
		models.student.bulkCreate(req.student, {
			updateOnDuplicate: Object.keys(req.student[0]),
			ignoreDuplicates:true
		}),
		models.studentdetail.bulkCreate(req.studentdetails, {
			updateOnDuplicate: Object.keys(req.studentdetails[0]),
			ignoreDuplicates:true
		}),
		models.user.bulkCreate(req.user, {
			updateOnDuplicate:Object.keys(req.user[0]),
			ignoreDuplicates:true
		}),
		models.userdetail.bulkCreate(req.userdetails, {
			updateOnDuplicate: Object.keys(req.userdetails[0]),
			ignoreDuplicates:true
		}),
		models.studentrecord.bulkCreate(req.studentrecord, {
			updateOnDuplicate: Object.keys(req.studentrecord[0]),
			ignoreDuplicates:true
		}),
	])
		.then(() => ({status: true, message:language.lang({key:'updatedSuccessfully', lang:req.lang})}));
};
