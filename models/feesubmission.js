'use strict';

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feesubmission', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		masterId: {
			type: DataTypes.INTEGER
		},
		academicSessionId: {
			type: DataTypes.INTEGER,
		},
		studentId: {
			type: DataTypes.INTEGER,
		},
		date: {
			type: DataTypes.DATEONLY,
		},
		discount_type: {
			type: DataTypes.INTEGER,
		},
		discount_value: {
			type: DataTypes.DECIMAL(10, 2),
			validate: {
				is: {
					args: [/^(?:\d{1,8}(?:\.\d{1,2})?)?$/],
					msg: 'Please enter valid number.',
				},
				notEmpty: function (value, next) {
					if (this.discount_type !== null && value.length === 0) {
						next('isRequired');
					} else {
						next();
					}
				}
			},
		},
		mode: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired',
				}
			},
		},
		approved: {
			type: DataTypes.STRING,
		},
		approval_date: {
			type: DataTypes.DATEONLY,
			validate: {
				notEmpty: {
					msg: 'isRequired',
				}
			},
		},
		cheque: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: function (value, next) {
					if (this.mode === '' || this.mode === 0)
						next();
					else  if (!value)
						next('isRequired');
					else if (value.length > 255)
						next('This field not be more than 255 characters.');
					else
						next();
				},
			}
		},
		bank: {
			type: DataTypes.STRING,
			validate: {
				valid: function (value, next) {
					if (this.mode === '' || this.mode === 0)
						next();
					else  if (!value)
						next('isRequired');
					else if (value.length > 255)
						next('This field not be more than 255 characters.');
					else
						next();
				},
			}
		},
		remarks: {
			type: DataTypes.STRING,
		},
	}, {
		tableName: 'fee_submissions',
	});