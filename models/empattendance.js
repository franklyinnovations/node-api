'use strict';

module.exports=  function(sequelize, DataTypes){
	var Model = sequelize.define('empattendance', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		userId: {
			type: DataTypes.INTEGER
		},
		masterId: {
			type: DataTypes.INTEGER
		},
		academicsessionId: {
			type: DataTypes.INTEGER
		},
		user_type:{
			type: DataTypes.STRING,
		},
		roleId:{
			type: DataTypes.INTEGER,
		},
		attendancestatus:{
			type: DataTypes.STRING,
		},
		empleaveId:{
			type: DataTypes.INTEGER,
		},
		date: {
			type: DataTypes.DATEONLY,
		},
	},{
		tableName: 'emp_attendances'
	});
	return Model;
};
