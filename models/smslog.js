'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('smslog', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		senderId: {
			type: DataType.INTEGER
		},
		receiverId: {
			type: DataType.INTEGER
		},
		masterId: {
			type: DataType.INTEGER
		},
		module: {
			type: DataType.STRING(100)
		},
		message: {
			type: DataType.TEXT
		}
	}, {
		updatedAt: false,
		tableName: 'sms_logs'
	});
};