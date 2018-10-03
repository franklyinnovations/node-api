'use strict';

const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feedrecord', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		feedId: {
			type: DataTypes.INTEGER,
		},
		type: {
			type: DataTypes.VIRTUAL,
		},
		file: {
			type: DataTypes.STRING,
		},
	}, {
		timestamps: false,
		tableName: 'feed_records',
		hooks: {
			beforeCreate: [
				makeOptimizerHook('file', false),
			],
		}
	});
