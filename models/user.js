'use strict';

const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

function convertId(x) {
	var res = 1;
	while(x > 0) {
		if (x & 1) {
			res += 0x6c0c296;
		}
		res = (res << 1) % 0x1ffffffd;
		x = (x >> 1);
	}
	return res;
}

var bcrypt = require('bcrypt-nodejs');
module.exports=  function(sequelize, DataTypes){
	var Model = sequelize.define('user', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		parentId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		roleId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		masterId: {
			type: DataTypes.INTEGER
		},
		mobile: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				is: {
					args: /^\d{6,15}$/,
					msg: 'notValidMobile'
				},
				isExist: function(value , next){
					if(this.user_type === 'teacher'){
						this.Model.find({where:{id:{$ne: this.id}, mobile:value, masterId:this.masterId, user_type:this.user_type}}).then(function(data){
							if (data !== null) {
								next('isUnique');
							} else {
								next();
							}
						});
					} else if(this.user_type === 'driver' || this.user_type === 'helper'){
						this.Model.find({where:{id:{$ne: this.id}, mobile:value, masterId:this.masterId, user_type:this.user_type}}).then(function(data){
							if (data !== null) {
								next('isUnique');
							} else {
								next();
							}
						});
					} else if (this.user_type === 'institute') {
						this.Model.find({where:{id:{$ne: this.id}, mobile:value, user_type:this.user_type}}).then(function(data){
							if (data !== null) {
								next('isUnique');
							} else {
								next();
							}
						});
					} else {
						next();
					}
				}
			}
		},
		alternate_mobile: {
			type: DataTypes.STRING,
			validate: {
				valid: function (value, next) {
					if (!value || /^\d{6,15}$/.test(value)) {
						next();
					} else {
						next('notValidMobile');
					}
				}
			}
		},
		salutation: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		email: {
			type: DataTypes.STRING,
			validate: {
				notEmp:function(value, next){
					if(this.user_type == 'institute' || this.user_type == 'admin' || this.user_type == 'teacher'){
						if(value == ''){
							next('isRequired');
						} else {
							next();
						}
					} else {
						next();
					}
				},
				isFun : function (value, next){
					var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
					if(value !=='' && !re.test(value)){
						return next('isEmail');
					}
					return next();
				},
				isUnique: async function (value, next) {
					if (this.user_type === 'institute') {
						if (await this.Model.find({where:{id:{$ne: this.id}, email:value, user_type:this.user_type}})) {
							next('isUnique');
						} else {
							next();
						}
					} else {
						next();
					}
				},
			}
		},
		backup_email: {
			type: DataTypes.STRING,
			allowNull: true,
			defaultValue: null,
			validate: {
				isFun : function (value, next){
					var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
					if(value !=='' && !re.test(value)){
						return next('isEmail');
					}
					return next();
				}
			}
		},
		user_name: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				isUnique: sequelize.validateIsUnique('user_name', 'un_isUnique')
			}
		},
		password: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				len:{
					args: [6],
					msg: 'isLength'
				},
				isCheck: function(value, next){
					if(value !== '' && this.curr_password !== ''){
						if (value !=='' && value === this.curr_password) {
							return next('newnotsameasold');
						}
					}
					return next();
				}
			}
		},
		govt_identity_number: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: function (value, next) {
					if(this.user_type === 'helper'){
						if(value === ''){
							next();
						}else if (value.length > 50){
							next('Length can not be more than 50.');
						}else{
							next();
						}
					}else if (value.length > 50){
						next('Length can not be more than 50.');
					}
					else if(value === ''){
						next('isRequired');
					}else{
						next();
					}
				},
			}
		},
		govt_identity_expiry: {
			type: DataTypes.DATEONLY,
			validate: {
				notEmpty: function (value, next) {
					if(this.user_type === 'helper'){
						next();
					}else if(value === ''){
						next('isRequired');
					}else{
						next();
					}
				}
			}
		},
		govtIdentityId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		user_image: {
			type: DataTypes.STRING
		},
		signature: {
			type: DataTypes.STRING
		},
		govt_identity_image: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		reset_password_token: {
			type: DataTypes.STRING
		},
		token: {
			type: DataTypes.STRING
		},
		encryption_key: {
			type: DataTypes.STRING
		},
		user_type: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		default_lang: {
			type: DataTypes.INTEGER
		},
		secondary_lang: {
			type: DataTypes.INTEGER
		},
		defaultSessionId: {
			type: DataTypes.INTEGER
		},
		is_active: {
			type: DataTypes.STRING
		},
		is_notification: {
			type: DataTypes.STRING
		},
		device_id: {
			type: DataTypes.STRING
		},
		device_type: {
			type: DataTypes.STRING
		},
		useremail: {
			type: DataTypes.VIRTUAL,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				isEmail: {
					msg: 'isEmail'
				}
			}
		},
		username: {
			type: DataTypes.VIRTUAL,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
			}
		},
		userpassword: {
			type: DataTypes.VIRTUAL,
			validate: {
				notEmpty: {
					msg: 'isRequired',
				},
			}
		},
		confirm_password: {
			type: DataTypes.VIRTUAL,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				isConfrm: function(value, next){
					if (value !=='' && this.password && value !== this.password) {
						return next('passwordNotConfrm');
					}
					return next();
				}
			}
		},
		curr_password: {
			type: DataTypes.VIRTUAL,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				isCurrent: function(value, next){
					if (value !=='') {
						this.Model.find({where:{id:this.id}}).then(function(data){
							if (data !== null) {
								if (!bcrypt.compareSync(value, data.password)) {
									next('incorrectPassword');
								} else{
									next();
								}
							} else {
								next('invalidUser');
							}
						});
					} else {
						return next();
					}

				}
			}
		}
	},{
		tableName: 'users',
		hooks: {
			beforeUpdate: [
				makeOptimizerHook('user_image', true),
				makeOptimizerHook('signature', true),
				makeOptimizerHook('govt_identity_image')
			],
			beforeCreate: [
				makeOptimizerHook('user_image', true),
				makeOptimizerHook('signature', true),
				makeOptimizerHook('govt_identity_image'),
			],
			afterCreate: [function (instance) {
				instance.set('user_name', convertId(instance.id));
				return instance.save({
					validate: false
				});
			}]
		}
	});
	return Model;
};
