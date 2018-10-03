'use strict';

module.exports = function (sequalize, DataTypes) {
	return sequalize.define('tagdetail', {
		id: {
			type: DataTypes.INTEGER
			, primaryKey: true
			, autoIncrement: true
		}
		, tagId: {
			type: DataTypes.INTEGER
		}
		, languageId: {
			type: DataTypes.INTEGER
		}
		, title: {
			type: DataTypes.STRING(20)
			, validate: {
				valid: function (value, next) {
					value = value.trim();
					if (value.length === 0) {
						next('isRequired');
					} else if (value.length > 100) {
						next('Title length can not be more than 100.');
					} else {
						next();
					}
				}
			}
		}
		, description : {
			type: DataTypes.TEXT
			, validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				isValid:function(value, next){
					if (value !== '' && value.length > 140) {
					  next('Description length can not be more than 140.');
					} else {
					  next();
					}
				}
			}
		}
	}, {
		tableName: 'tag_details'
		, timestamps: false
	});
};