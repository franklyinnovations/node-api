'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('onlineuser', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true
		},
		token: {
			type: DataType.STRING
		},
		userId: {
			type: DataType.INTEGER
		},
		masterId: {
			type: DataType.INTEGER
		},
		socket: {
			type: DataType.STRING
		}
	}, {
		timestamps: false,
		tableName: 'online_users'
	});
};