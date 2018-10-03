'use strict';

module.exports = (sequelize, DataTypes) => 
	sequelize.define('infrastructure', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		masterId: {
			type: DataTypes.INTEGER
		},
		infratypeId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired',
				},
			},
		},
		is_active: {
			type: DataTypes.INTEGER,
		}
	}, {
		tableName: 'infrastructures',
	});