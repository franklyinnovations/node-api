'use strict';

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feedlike', {
		feedId: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		userId: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
	}, {
		tableName: 'feed_likes'
	});
