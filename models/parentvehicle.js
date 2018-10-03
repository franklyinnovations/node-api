'use strict';

module.exports=  function(sequelize, DataTypes){
	var Model = sequelize.define('parentvehicle', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		masterId: {
			type: DataTypes.INTEGER
		},
		studentId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired',
				}
			}
		},
		number: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				},
				len: {
					args: [1, 20],
					msg: 'Length can not be more than 20.',
				},
				isExist: function(value , next){
					this.Model.find({where:{id:{$ne: this.id}, number:value, masterId:this.masterId}}).then(function(data){
						if (data !== null) {
							next('isUnique');
						} else {
							next();
						}
					});
				},
			}
		},
		insurance_number: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				},
				len: {
					args: [1, 20],
					msg: 'Length can not be more than 20.',
				},
				isExist: function(value , next){
					this.Model.find({where:{id:{$ne: this.id}, number:value, masterId:this.masterId}}).then(function(data){
						if (data !== null) {
							next('isUnique');
						} else {
							next();
						}
					});
				}
			}
		},
		insurance_expiry_date: {
			type: DataTypes.DATEONLY,
			validate: {
				notEmpty: {
					msg:'isRequired'
				},
				isValid: function(value, next){
					if(value === 'notValid'){
						next('dateFormatNotValid');
					} else {
						next();
					}
				}
			}
		},
		vehicle_type: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		fuel_type: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			},
		},
		make: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			},
		},    
		registration_number: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		pollution_control_number: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		pollution_control_expiry_date: {
			type: DataTypes.DATEONLY,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		vehicle_image: {
			type: DataTypes.STRING,
		},
		vehicle_document: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		pollution_control_certificate: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		insurance_certificate: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		is_active: {
			type: DataTypes.INTEGER,
		}
	},{
		tableName: 'parent_vehicles'
	});
	return Model;
};