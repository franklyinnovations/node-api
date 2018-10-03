'use strict';
module.exports = (sequelize, DataTypes) =>
	sequelize.define('fee', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		masterId: {
			type: DataTypes.INTEGER
		},
		academicSessionId: {
			type: DataTypes.INTEGER,
		},
		boardId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		classId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		is_active: {
			type: DataTypes.INTEGER,
		},
	}, {
		tableName: 'fees',
	});

