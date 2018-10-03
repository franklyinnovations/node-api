'use strict';

const fs = require('fs'),
	util = require('util');

const unlink = util.promisify(fs.unlink);

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feed', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		masterId: {
			type: DataTypes.INTEGER
		},
		academicSessionId: {
			type: DataTypes.INTEGER
		},
		userId: {
			type: DataTypes.INTEGER
		},
		bcsmapId: {
			type: DataTypes.INTEGER
		},
		controlUserId: {
			type: DataTypes.INTEGER
		},
		approved: {
			type: DataTypes.INTEGER
		},
		description: {
			type: DataTypes.STRING,
		},
	}, {
		tableName: 'feeds',
		hooks: {
			beforeDestroy: [
				async function removeFeedrecordFiles(feed) {
					let feedrecords = await feed.getFeedrecords();
					feedrecords.forEach(feedrecord => {
						unlink(feedrecord.file).catch(console.error);
					});
				}
			],
		}
	});
