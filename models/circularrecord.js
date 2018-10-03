'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('circularrecord', {
		circularId: {
			type: DataType.INTEGER,
			primaryKey: true
		},
		bcsMapId: {
			type: DataType.INTEGER,
			primaryKey: true
		}
	}, {
		tableName: 'circular_records',
		timestamps: false
	});
};