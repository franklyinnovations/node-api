'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('trip', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		masterId: {
			type: DataType.INTEGER
		},
		rvdhsmapId: {
			type: DataType.INTEGER
		},
		vehicleId: {
			type: DataType.INTEGER
		},
		driverId: {
			type: DataType.INTEGER
		},
		helperId: {
			type: DataType.INTEGER
		},
		date: {
			type: DataType.INTEGER
		},
		status: {
			type: DataType.INTEGER
		}
	}, {
		tableName: 'trips',
		updatedAt: false
	});
};