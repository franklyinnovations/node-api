'use strict';

module.exports = (sequelize, DataTypes) => 
	sequelize.define('infratype', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		masterId: {
			type: DataTypes.INTEGER
		},
	}, {
		tableName: 'infratypes',
	});
