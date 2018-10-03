'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('eventrecord', {
		eventId: {
			type: DataType.INTEGER,
			primaryKey: true
		},
		bcsMapId: {
			type: DataType.INTEGER,
			primaryKey: true
		}
	}, {
		tableName: 'event_records',
		timestamps: false
	});
};