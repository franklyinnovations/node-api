'use strict';

module.exports = (sequelize, DataType) => sequelize.define('marksheet', {
	id: {
		type: DataType.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	marksheetbuilderId: {
		type: DataType.INTEGER,
	},
	academicSessionId: {
		type: DataType.INTEGER
	},
	data: {
		type: DataType.TEXT,
	}
}, {
	tableName: 'marksheets',
	timestamps: false,
});
