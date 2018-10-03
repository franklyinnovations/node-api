'use strict';

module.exports = function(sequelize, DataTypes){
	var Model = sequelize.define('question', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		masterId: {
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
					msg:'isRequired'
				}
			}
		},
		languageId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		userId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		classId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		subjectId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		time_to_attempt_question: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg:'isRequired'
				},
				is: {
					args: /^\d+$/,
					msg: 'Enter only numeric value'
				}
			}
		},
		questionControlTypeId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		number_of_options: {
			type: DataTypes.INTEGER,
			validate: {
				notEmp:function(value, next){
					if(this.question_type_slug != 'text_type' && value == ''){
						next('isRequired');
					} else {
						next();
					}
				},
			}
		},
		question_type_slug: {
			type: DataTypes.VIRTUAL
		}
	}, {
		tableName: 'questions',
	});
	return Model;
};
