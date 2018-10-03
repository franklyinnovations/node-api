'use strict';

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feepenalty', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		masterId: {
			type: DataTypes.INTEGER
		},
		is_active: {
			type: DataTypes.INTEGER
		},
		num_of_slabs: {
			type: DataTypes.VIRTUAL,
			validate: {
				min: {
					args: [1],
					msg: 'Please Add at least one slab',
				}
			} 
		},
	},{
		tableName: 'fee_penalties'
	});

