'use strict';

const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

module.exports=  function(sequelize, DataTypes){
	var Model = sequelize.define('institute', {
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
		parentInstituteId: {
			type: DataTypes.INTEGER
		},
		is_institute: {
			type: DataTypes.VIRTUAL,
			validate: {
				notEmpty: function(value, next){
					if (value === '1' && (this.parentInstituteId === 0 || this.parentInstituteId === null)) {
						next('isRequired');
					} else {
						next();
					}
				}
			}
		},
		phone: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				is: {
					args: /^\d{6,15}$/,
					msg: 'notValidPhone'
				},
				isUnique: sequelize.validateIsUnique('phone', 'isUnique')
			}
		},
		countryId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		stateId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		cityId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		zip_code: {
			type: DataTypes.STRING,
			validate: {
				len: function(value, next){
					if (value !== '' && value.length > 10) {
						next('Length can not be more than 10.');
					} else {
						next();
					}
				}
			}
		},
		lat: {
			type: DataTypes.STRING,
		},
		lng: {
			type: DataTypes.STRING,
		},
		registration_number: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired',
				},
				len: {
					args: [1, 20],
					msg: 'Length can not be more than 20.',
				},
				isUnique: sequelize.validateIsUnique('registration_number', 'isUnique')
			}
		},
		website_url: {
			type: DataTypes.STRING,
			validate: {
				len: {
					args: [0, 150],
					msg: 'Length can not be more than 150.',
				}
			}
		},
		sms_provider: {
			type: DataTypes.INTEGER(8),
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		themeId: {
			type: DataTypes.INTEGER,
		},
		institute_image: {
			type: DataTypes.STRING
		},
		institute_logo: {
			type: DataTypes.STRING
		},
		timezone: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		min_admission_years: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				isNumeric: {
					msg: 'Please enter valid number'
				},
				min: {
					args: [0],
					msg: 'Please enter valid number'
				},
				max: {
					args: [99],
					msg: 'Value should be from 1 to 99'
				}
			}
		},
		min_admission_months: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				isNumeric: {
					msg: 'Please enter valid number'
				},
				min: {
					args: [0],
					msg: 'Please enter valid number'
				},
				max: {
					args: [11],
					msg: 'Value should be from 0 to 11'
				},
				isValid: function(value, next){
					if(this.min_admission_years === 0 && value === 0){
						next('Value should be from 0 to 11');
					} else {
						next();
					}
				}
			}
		},
		smsProviderAuthKey: {
			type: DataTypes.STRING
		},
		smsSenderName: {
			type: DataTypes.STRING
		},
		pan_no: {
			type: DataTypes.STRING,
		},
		account_no: {
			type: DataTypes.STRING,
		},
		bank_name: {
			type: DataTypes.STRING,
		},
		bank_challan_charges: {
			type: DataTypes.DECIMAL(10, 2),
			validate: {
				is: {
					args: [/^(?:\d{1,8}(?:\.\d{1,2})?)?$/],
					msg: 'Please enter valid number.',
				},
			},
		},
		bank_branch: {
			type: DataTypes.STRING,
		},
		ifsc_code: {
			type: DataTypes.STRING,
		},
		cheque_image: {
			type: DataTypes.STRING,
		},
		fee_active: {
			type: DataTypes.INTEGER
		},
		stateName: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		cityName: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		date_format: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			},
		},
		digest: {
			type: DataTypes.INTEGER,
		},
		attendance_type: {
			type: DataTypes.INTEGER,
		},
		attendance_access: {
			type: DataTypes.INTEGER,
		},
	},{
		tableName: 'institutes',
		hooks: {
			beforeUpdate: [makeOptimizerHook('institute_image', true),makeOptimizerHook('cheque_image', true), makeOptimizerHook('institute_logo', true)],
			beforeCreate: [makeOptimizerHook('institute_image', true),makeOptimizerHook('cheque_image', true), makeOptimizerHook('institute_logo', true)],
		}
	});

	return Model;
};

