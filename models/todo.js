'use strict';

module.exports=  function(sequelize, DataTypes){
	return sequelize.define('todo', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		userId: {
			type: DataTypes.INTEGER
		},
		subject: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				},
				len:{
					args: [1, 50],
					msg: 'isMaxlength50'
				}
			}
		},
		message: {
			type: DataTypes.STRING,
			validate: {
				len:{
					args: [0, 140],
					msg: 'isMaxlength140'
				},
			}
		},
		date: {
			type: DataTypes.DATE,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		}
	}, {
		tableName: 'todo_lists'
	});
};

