'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('marksheetbuilderbcsmap', {
		marksheetbuilderId: {
			type: DataType.INTEGER,
			primaryKey: true,
		},
		bcsmapId: {
			type: DataType.INTEGER,
			primaryKey: true,
		}
	}, {
		tableName: 'marksheet_builder_bcsmaps',
		timestamps: false,
	});
};
