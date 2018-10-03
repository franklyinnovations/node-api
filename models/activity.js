'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('activity', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		masterId: {
			type: DataType.INTEGER
		},
		superActivityId: {
			type: DataType.INTEGER
		}
	}, {
		tableName: 'activities'
	});
};
