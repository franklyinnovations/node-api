'use strict';

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feediscount', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		masterId: {
			type: DataTypes.INTEGER,
		},
		feeheadId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			},
		},
		type: {
			type: DataTypes.INTEGER,
		},
		value: { 
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				isDecimal: {
					msg: 'Please enter valid number.',
				},
				min: {
					args: [0],
					msg: 'Please enter valid number',
				},
				len: {
					args: [1, 10],
					msg: 'Length can not be more than 10.',
				},
			}
		},
		is_active: {
			type: DataTypes.INTEGER,
		},
	},{
		tableName: 'fee_discounts',
	});

