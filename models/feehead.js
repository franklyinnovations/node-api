'use strict';

module.exports=  (sequelize, DataTypes) =>
	sequelize.define('feehead', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		masterId: {
			type: DataTypes.INTEGER
		},
		type: {
			type: DataTypes.STRING,
			validate:{
				notEmpty:{
					msg:'isRequired'
				}
			}
		},
		no_of_installments: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				max: {
					args: [12],
					msg: 'Maximum 12 installments allowed.'
				},
				min: {
					args: [1],
					msg: 'Please enter valid number.'
				},
				isInt: {
					msg: 'Please enter valid number.'
				}
			}
		},
		vehicle_type: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		routeId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		routeaddressId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		is_active: {
			type: DataTypes.INTEGER,
		},
		transportationFeeType: {
			type: DataTypes.VIRTUAL,
			validate: {
				notEmpty: {
					msg: 'isRequired',
				},
			}
		},
	}, {
		tableName: 'fee_heads'
	});
