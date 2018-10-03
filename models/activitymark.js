'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('activitymark', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		activityScheduleId: {
			type: DataType.INTEGER
		},
		bcsMapId: {
			type: DataType.INTEGER
		}
	}, {
		tableName: 'activity_marks'
	});
};
