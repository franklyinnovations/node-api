'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('circulardetail', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		circularId: {
			type: DataType.INTEGER
		},
		languageId: {
			type: DataType.INTEGER
		},
		title: {
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
		details: {
			type: DataType.TEXT,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
	}, {
		tableName: 'circular_details',
		timestamps: false
	});
};