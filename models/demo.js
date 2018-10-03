'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('demo', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		first_name: {
			type: DataType.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				len: {
					args: [1, 100],
					msg: 'Length can not be more than 100.',
				},
			}
		},
		last_name: {
			type: DataType.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				len: {
					args: [1, 100],
					msg: 'Length can not be more than 100.',
				},
			}
		},
		email: {
			type: DataType.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				len: {
					args: [1, 100],
					msg: 'Length can not be more than 100.',
				},
				isEmail : function (value, next){
					var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
					if(value !=='' && !re.test(value)){
						return next('isEmail');
					}
					return next();
				},
			}
		},
		mobile: {
			type: DataType.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				len: {
					args: [1, 100],
					msg: 'Length can not be more than 100.',
				},
				is: {
					args: /^\d{6,15}$/,
					msg: 'notValidMobile'
				},
			}
		},
		school_name: {
			type: DataType.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				len: {
					args: [1, 100],
					msg: 'Length can not be more than 100.',
				},
			},
		},
		number_of_students: {
			type: DataType.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				isValid: function (value, next) {
					var num = parseInt(value);
					if (value !== '' ) {
						if (isNaN(num) || num <= 0 || num != value) {
							next('Please enter valid number');
						} else if(num > 100000) {
							next('Maximum 100000 students allowed');
						} else {
							next();
						}
					} else {
						next();
					}
				},
			},
		},
		message: {
			type: DataType.TEXT,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				},
			}
		},
	}, {
		tableName: 'demos'
	});
};
