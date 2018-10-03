'use strict';
const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

module.exports = function (sequelize, DataType) {
	const model = sequelize.define('circular', {
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
		number: {
			type: DataType.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				len: {
					args: [1, 100],
					msg: 'Length can not be more than 100.',
				},
			}
		},
		date: {
			type: DataType.DATEONLY,
			validate: {
				notEmpty: {
					msg:'isRequired'
				},
			}
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
		tableName: 'circulars',
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
