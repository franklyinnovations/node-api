'use strict';

module.exports=  function(sequelize, DataTypes){
	var Model = sequelize.define('parentvehicledetail', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		parentvehicleId: {
			type: DataTypes.INTEGER
		},
		languageId: {
			type: DataTypes.INTEGER
		},
		owner: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				},
			}
		},
		model: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		colour: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		place: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
	},{
		tableName: 'parent_vehicle_details',
		timestamps: false
	});
	return Model;
};
