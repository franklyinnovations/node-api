'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('activitydetail', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		activityId: {
			type: DataType.INTEGER
		},
		languageId: {
			type: DataType.INTEGER
		},
		name: {
			type: DataType.STRING,
			 validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				len: {
		        	args: [1, 200],
		        	msg: 'Length can not be more than 200.',
		        }
			}
		}
	}, {
		tableName: 'activity_details',
		timestamps: false
	});
};
