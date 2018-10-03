"use strict";

module.exports=  function(sequelize, DataTypes){
	var Model = sequelize.define("examscheduledetail", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		examScheduleId: {
			type: DataTypes.INTEGER
			
		},
		masterId: {
			type: DataTypes.INTEGER
		},
		subjectId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				isExist: function(value, next){
					Model.find({where:{id:{$ne:this.id}, masterId:this.masterId, examScheduleId:this.examScheduleId, subjectId:value, exam_type: this.exam_type}})
						.then(function(data){
							if (data !==null) {
								next('isUnique');
							} else {
								next();
							}
						});
				}
			}
		},
		date: {
			type: DataTypes.DATEONLY,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		exam_type: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		start_time: {
			type: DataTypes.STRING,
			validate: {
				isValidTime: function (value, next) {
					value = value.trim();
					if (value.length === 0) {
						next('isRequired');
					}else if (isNaN(Date.parse('1 Jan 2017 ' + value))) {
						next('Should be a valid time.');
					} else {
						Model.find({where:{id:{$ne:this.id}, masterId:this.masterId, examScheduleId:this.examScheduleId, date:this.date, $or:[{start_time:{$lt:value}, end_time:{$gt:value}}, {start_time:{$lt:this.end_time}, end_time:{$gt:this.end_time}}, {start_time:{$gte:value}, end_time:{$lte:this.end_time}}]}})
						.then(function(data){
							if (data !==null) {
								next('isTimeOverlapped');
							} else {
								next();
							}
						});
					}
				}
			}
		},
		end_time: {
			type: DataTypes.STRING,
			validate: {
				isValid: function(value, next){
					value = value.trim();
					if (value.length === 0) return next('isRequired');
					value = Date.parse('1 JAN 2017 ' + value);
					var start_time = Date.parse('1 JAN 2017 ' + this.start_time);
					if (isNaN(value)) {
						next('Should be a valid time.');
					} else if (value <= start_time) {
						next('Should be after start time.');
					} else {
						next();
					}
				}
			}
		},
		duration: {
			type: DataTypes.STRING
		},
		min_passing_mark: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				isFloat:{
					msg: 'isNumeric'
				},
				isVali:function(value, next){
					var minMark = parseInt(value);
					var maxMark = parseInt(this.max_mark);
					if (minMark >= maxMark) {
						next('minMarkNotGreaterMaxMark');
					} else if (typeof value === 'string' && value.length > 5) {
						next('Marks can not have more than 5 digits.');
					} else {
						next();
					}
				}
			}
		},
		max_mark: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				isFloat:{
					msg: 'isNumeric'
				},
				length: function (value, next) {
					if (typeof value === 'string' && value.length > 5) {
						next('Marks can not have more than 5 digits.');
					} else {
						next();
					}
				}
			}
		},
		updaterId: {
			type: DataTypes.INTEGER
		}
	},{
		tableName: 'exam_schedule_details',
		timestamps: false,
	});
	return Model;
};

