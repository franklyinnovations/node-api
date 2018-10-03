'use strict';

module.exports=	function(sequelize, DataTypes){
	var Model = sequelize.define('examsyllabus', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		examscheduledetailId: {
			type: DataTypes.INTEGER
		},
		languageId: {
			type: DataTypes.INTEGER
		},
		syllabus: {
			type: DataTypes.TEXT
		}
	},{
		tableName: 'exam_syllabus',
		timestamps: false,
		indexes: [{
			name: 'language',
			type: 'UNIQUE',
			fields: ['examscheduledetailId', 'languageId']
		}]
	});
	return Model;
};
