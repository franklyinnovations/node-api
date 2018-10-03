'use strict';

module.exports = function (sequalize, DataTypes) {
	return sequalize.define('ticketmessage', {
		id: {
			type: DataTypes.INTEGER
			, primaryKey: true
			, autoIncrement: true
		}
		, ticketId: {
			type: DataTypes.INTEGER
		}
		, userId: {
			type: DataTypes.INTEGER
		}
		, message: {
			type: DataTypes.TEXT
			, validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		}
		, files : {
			type: DataTypes.TEXT
		}
	}, {
		tableName: 'ticket_messages'
	});
};