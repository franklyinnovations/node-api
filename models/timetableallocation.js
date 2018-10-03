'use strict';

module.exports=  function(sequelize, DataTypes){
	var Model = sequelize.define('timetableallocation', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		timetableId: {
			type: DataTypes.INTEGER
		},
		teacherId: {
			type: DataTypes.INTEGER
		},
		weekday: {
			type: DataTypes.INTEGER
		},
		subjectId: {
			type: DataTypes.INTEGER
		},
		start_time: {
			type: DataTypes.TIME
		},
		end_time: {
			type: DataTypes.TIME
		},
		is_break: {
			type: DataTypes.INTEGER
		},
		order: {
			type: DataTypes.INTEGER
		},
		period: {
			type: DataTypes.INTEGER
		},
		tagId: {
			type: DataTypes.INTEGER
		},
		icon: {
			type: DataTypes.STRING
		},
	},{
		tableName: 'timetable_allocations',
		timestamps: false,
	});
	return Model;
};

