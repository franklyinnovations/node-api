'use strict';
module.exports= function(sequelize, DataTypes){
	var Model = sequelize.define('teacher', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		userId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		masterId: {
			type: DataTypes.INTEGER,
		},
		countryId: {
			type: DataTypes.INTEGER,
		},
		stateId: {
			type: DataTypes.INTEGER,
		},
		cityId: {
			type: DataTypes.INTEGER,
		},
		gender: {
			type: DataTypes.STRING,
		},
		marital_status: {
			type: DataTypes.STRING,
		},
		join_date: {
			type: DataTypes.DATEONLY,
		},
		dob: {
			type: DataTypes.DATEONLY,
			validate: {
				isFun: function(value, next){
					if (value !== '' && isNaN(Date.parse(value))) {
						next("Invalid date of birth");
					} else if(Date.parse(value) >= Date.parse(this.join_date)){
						next('DOB should be before the Date of join');
					} else {
						next();
					}
				}
			}
		},
		subjectId: {
			type: DataTypes.VIRTUAL,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		}
	},{
		tableName: 'teachers'
	});
	return Model;
};
