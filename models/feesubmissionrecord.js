'use strict';

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feesubmissionrecord', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		feesubmissionId: {
			type: DataTypes.INTEGER
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
	}, {
		tableName: 'fee_submission_records',
		timestamps: false,
	});