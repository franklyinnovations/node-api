'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('activityschedule', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		examscheduleId: {
			type: DataType.INTEGER
		},
		date: {
			type: DataType.INTEGER
		},
		activityId: {
			type: DataType.INTEGER
		},
		max_marks: {
			type: DataType.INTEGER
		},
		studentId: {
			type: DataType.VIRTUAL
		},
	}, {
		tableName: 'activity_schedules',
		timestamps: false
	});
};
