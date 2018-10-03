'use strict';

module.exports=  function(sequelize, DataTypes){
	var Model = sequelize.define('rvdhsmaprecord', {
		rvdhsmapId: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		studentId: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		pickupId: {
			type: DataTypes.INTEGER
		},
		dropId: {
			type: DataTypes.INTEGER,
		},
	},{
		tableName: 'rvdhs_map_records',
		timestamps: false,
	});
	return Model;
};
