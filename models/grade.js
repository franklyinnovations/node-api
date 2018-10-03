'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('grade', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		masterId: {
			type: DataType.INTEGER
		},
		data: {
			type: DataType.TEXT,
			get: function () {
				return JSON.parse(this.getDataValue('data'));
			},
			set: function (value) {
				this.setDataValue('data', JSON.stringify(value));
			}
		}
	}, {
		tableName: 'grades'
	});
};
