'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('activitymarkrecord', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		activityMarkId: {
			type: DataType.INTEGER
		},
		studentId: {
			type: DataType.INTEGER
		},
		obtained_mark: {
			type: DataType.DECIMAL(10, 2)
		}
	}, {
		tableName: 'activity_mark_records',
		timestamps: false
	});
};
