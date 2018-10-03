'use strict';

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feepenaltyslab',{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		feepenaltyId: {
			type: DataTypes.INTEGER,
		},
		days: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		amount: {
			type: DataTypes.DECIMAL(10, 2),
		}
	},{
		tableName: 'fee_penalty_slabs',
		timestamps: false,
	});

