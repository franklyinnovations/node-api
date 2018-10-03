'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('triprecord', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		tripId: {
			type: DataType.INTEGER
		},
		studentId: {
			type: DataType.INTEGER
		},
		status: {
			type: DataType.INTEGER
		},
		type: {
			type: DataType.INTEGER
		},
		times: {
			type: DataType.TEXT,
			get: function () {
				return JSON.parse(this.getDataValue('times'));
			},
			set: function (value) {
				this.setDataValue('times', JSON.stringify(value));
			}
		}
	}, {
		tableName: 'trip_records',
		timestamps: false
	});
};