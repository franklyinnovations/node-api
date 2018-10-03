'use strict';

module.exports = (sequelize, DataTypes) =>
	sequelize.define('digest', {
		userId: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		model: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		interval: {
			type: DataTypes.INTEGER,
		},
		date: {
			type: DataTypes.DATEONLY,
		},
	}, {
		tableName: 'digests',
		timestamps: false,
	});
