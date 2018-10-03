'use strict';

module.exports = function (sequelize, DataType) {
	let Model = sequelize.define('marksheetbuilder', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		masterId: {
			type: DataType.INTEGER
		},
		name: {
			type: DataType.STRING(64),
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				len: {
					args: [1, 64],
					msg: 'Length can not be more than 64.',
				},
			},
		},
		template: {
			type: DataType.STRING(64),
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
			},
		},
		settings: {
			type: DataType.JSON,
		},
		is_active: {
			type: DataType.INTEGER,
		},
		hasBCSMaps: {
			type: DataType.VIRTUAL(DataType.Boolean, 'bcsmaps'),
			validate: {
				notEmpty: (value, next) => {
					if (value)
						next();
					else
						next('isRequired');
				}
			},
		}
	}, {
		tableName: 'marksheet_builders',
	});
	Model.templates = [
		'hydrogen',
	];
	return Model;
};
