'use strict';

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feesubmissiondiscount', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		feesubmissionrecordId: {
			type: DataTypes.INTEGER
		},
		feediscountId: {
			type: DataTypes.INTEGER,
		},
		amount: {
			type: DataTypes.DECIMAL(10, 2),
		},
	}, {
		tableName: 'fee_submission_discounts',
		timestamps: false,
	});