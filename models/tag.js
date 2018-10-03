'use strict';

module.exports = function (sequalize, DataTypes) {
	return sequalize.define('tag', {
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
		, is_active: {
			type: DataTypes.INTEGER(6)
			, validate: {
				isIn: {
					args: [[0, 1]]
					, msg: 'Invalid Status'
				}
			} 
		}
		, type: {
			type: DataTypes.INTEGER(6)
			, validate: {
				notEmpty: {
					msg:'isRequired'	
				}
			}
		}
	}, {
		tableName: 'tags'
	});
};