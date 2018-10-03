'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('eventdetail', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		eventId: {
			type: DataType.INTEGER
		},
		languageId: {
			type: DataType.INTEGER
		},
		title: {
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
		venue: {
			type: DataType.TEXT,
			validate: {
				len: {
					args: [0, 150],
					msg: 'Length can not be more than 150.',
				}
			}
		},
		details: {
			type: DataType.TEXT,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		instructions: {
			type: DataType.TEXT,
		},
		milestone: {
			type: DataType.STRING,
			validate: {
				len: function(value, next){
					if (value !== '' && value.length > 100) {
						next('Length can not be more than 100.');
					} else {
						next();
					}
				}
			}
		},
		dresscode: {
			type: DataType.TEXT,
			validate: {
				len: function(value, next){
					if (value !== '' && value.length > 100) {
						next('Length can not be more than 100.');
					} else {
						next();
					}
				}
			}
		}
	}, {
		tableName: 'event_details',
		timestamps: false
	});
};