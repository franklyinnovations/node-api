"use strict";
module.exports= function(sequelize, DataTypes){
	var Model = sequelize.define("exambulkattendance", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		masterId: {
			type: DataTypes.INTEGER
		},
		bcsmapId: {
			type: DataTypes.INTEGER,
			validate:{
				notEmpty:{
					msg:'isRequired'
				}
			}
		},
		academicSessionId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		examheadId: {
			type: DataTypes.INTEGER,
		},
		month: {
			type: DataTypes.STRING,
		},
		pattern: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		total: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		}
	},{
		tableName: 'exam_bulk_attendances'
	});
	return Model;
};

