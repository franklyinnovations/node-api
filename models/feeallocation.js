'use strict';

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feeallocation', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		feeId: {
			type: DataTypes.INTEGER,
		},
		feeheadId: {
			type: DataTypes.INTEGER,
		},
		installment: {
			type: DataTypes.INTEGER,
		},
		amount: {
			type: DataTypes.DECIMAL(10, 2),
		},
		date: {
			type: DataTypes.DATEONLY,
		},
	},{
		tableName: 'fee_allocations',
		timestamps: false,
	});