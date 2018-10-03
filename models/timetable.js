'use strict';
module.exports=  function(sequelize, DataTypes){
	var Model = sequelize.define('timetable', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		bcsMapId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		academicSessionId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg:'isAcademicSession'
				}
			}
		},
		classteacherId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		masterId: {
			type: DataTypes.INTEGER
		},
		is_active: {
			type: DataTypes.STRING,
			validate: {
				isExist: function(value, next){
					this.Model.find({where:{id:{$ne: this.id}, bcsMapId:this.bcsMapId, academicSessionId:this.academicSessionId}}).then(function(data){
						if (data !== null) {
							next('isSameTimetableExist');
						} else {
							next();
						}
					});
				}
			}
		},
		period_no:{
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg:'isRequired'
				},
				isValid: function (value, next) {
					var num = parseInt(value);
					if (value !== '' ) {
						if (isNaN(num) || num <= 0 || num != value) {
							next('Please enter valid number.');
						} else if(num > 10) {
							next('Maximum 10 periods allowed.');
						} else {
							next();
						}
					} else {
						next();
					}
				}
			}
		},
		start_time:{
			type: DataTypes.TIME,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		weekday:{
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
	},{
		tableName: 'timetables'
	});
	return Model;
};
