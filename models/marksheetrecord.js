'use strict';

module.exports = (sequelize, DataType) => sequelize.define('marksheetrecord', {
	marksheetId: {
		type: DataType.INTEGER,
		primaryKey: true,
	},
	studentId: {
		type: DataType.INTEGER,
		primaryKey: true,
	},
	data: {
		type: DataType.TEXT,
	}
}, {
	tableName: 'marksheet_records',
	timestamps: false,
});
