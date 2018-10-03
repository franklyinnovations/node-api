'use strict';

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feesubmissionpenalty', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		feesubmissionrecordId: {
			type: DataTypes.INTEGER
		},
		feepenaltyId: {
			type: DataTypes.INTEGER,
		},
		amount: {
			type: DataTypes.DECIMAL(10, 2),
		},
	}, {
		tableName: 'fee_submission_penalties',
		timestamps: false,
	});