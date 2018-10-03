'use strict';
const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;
var moment = require('moment');

module.exports = function (sequelize, DataType) {
	const model = sequelize.define('event', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		masterId: {
			type: DataType.INTEGER
		},
		academicSessionId: {
			type: DataType.INTEGER
		},
		start: {
			type: DataType.DATE,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		end: {
			type: DataType.DATE,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				time: function (value, next) {
					var start = moment(value, 'YYYY-MM-DD hh:mm a'),
						end = moment(this.end, 'YYYY-MM-DD hh:mm a');
					if (moment(value).isAfter(moment(this.start))) {
						next();
					} else if (start.isValid() && end.isValid()) {
						next('End time must be after the start time');
					} else {
						next();
					}
				}
			},
		},
		users: {
			type: DataType.INTEGER,
			validate: {
				notEmpty: {
					msg: 'Please select at least one user type'
				},
				notIn: {
					args: [[0]],
					msg: 'Please select at least one user type'
				}
			}
		},
		file: {
			type: DataType.STRING,
		}
	}, {
		tableName: 'events',
		hooks: {
			beforeCreate: [
				makeOptimizerHook('file', false),
			],
			beforeUpdate: [
				makeOptimizerHook('file', false),
			],
		}
	});

	model.STUDENT_MASK = 1,
	model.TEACHER_MASK = (1 << 1),
	model.PARENT_MASK = (1 << 2);

	return model;
};
