'use strict';

module.exports = function (sequalize, DataTypes) {
	return sequalize.define('ticket', {
		id: {
			type: DataTypes.INTEGER
			, primaryKey: true
			, autoIncrement: true
		}
		, masterId: {
			type: DataTypes.INTEGER
		}
		, userId: {
			type: DataTypes.INTEGER
		}
		, assignedTo: {
			type: DataTypes.INTEGER
		}
		, title: {
			type: DataTypes.STRING(255)
			, validate: {
				valid: function (value, next) {
					if (value.trim().length === 0) {
						next('isRequired');
					} else if(value.length > 255){
						next('Length can not be more than 255.');
					} else {
						next();
					}
				}
			}
		}
		, type: {
			type: DataTypes.STRING(100)
			, validate: {
				valid: function(value, next) {
					if (value.trim().length === 0) {
						next('isRequired');
					} else if (value.length > 100){
						next('Length can not be more than 100.');
					} else {
						next();
					}
				}
			}
		}
		, status: {
			type: DataTypes.INTEGER(6)
			, validate: {
				valid: function (value, next) {
					value = parseInt(value);
					if (isNaN(value)) {
						next('isRequired');
					} else if (value < 0 || value > 4) {
						next('Invalid value');
					} else {
						next();
					}
				}
			}
		}
		, priority: {
			type: DataTypes.INTEGER(6)
			, validate: {
				valid: function (value, next) {
					value = parseInt(value);
					if (isNaN(value)) {
						next('isRequired');
					} else if (value < 0 || value > 3) {
						next('Invalid value');
					} else {
						next();
					}
				}
			}
		}
	}, {
		tableName: 'tickets'
	});
};