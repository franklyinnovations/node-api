'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('parent', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	masterId: {
		type: DataTypes.INTEGER,
		unique: 'unique_institute_parent',
	},
	mobile: {
		type: DataTypes.STRING,
		unique: 'unique_institute_parent',
	},
	token: {
		type: DataTypes.STRING,
	},
});