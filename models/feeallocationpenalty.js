'use strict';

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feeallocationpenalty', {
		feepenaltyId: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		feeId: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
	},{
		tableName: 'fee_allocation_penalties',
		timestamps: false,
	});
