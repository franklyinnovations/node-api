'use strict';

const models = require('../models');

const
	nothing = (() => undefined),
	relatedUserSocketsQuery = 'SELECT `socket` FROM `online_users` WHERE '
	+'`userId` NOT IN (SELECT `userId` FROM `chat_blocks` WHERE `blockedId` = :userId) '
	+ 'AND `userId` IN (SELECT (CASE WHEN `senderId` = :userId THEN `receiverId` ELSE `senderId` END) '
	+ 'FROM `messages` WHERE `senderId` = :userId OR `receiverId` = :userId '
	+ 'GROUP BY `senderId`, `receiverId`)';

let io;

models.message.belongsTo(models.user, {foreignKey: 'senderId', as: 'sender'});
models.message.belongsTo(models.user, {foreignKey: 'receiverId', as: 'receiver'});
models.user.hasMany(models.onlineuser);
models.user.belongsTo(models.role);
models.role.hasMany(models.rolepermission);
models.rolepermission.belongsTo(models.permission);

function getRelatedSockets(userId) {
	return models.sequelize.query(
		relatedUserSocketsQuery,
		{
			type: models.sequelize.QueryTypes.SELECT,
			replacements: {
				userId
			}
		}
	);
}

function canSendMessage(sender, receiverId) {
	return Promise.all([
		models.user.findOne({
			where: {
				id: receiverId,
				is_active: 1
			},
			attributes: ['user_type', 'masterId']
		}),
		models.chatblock.count({
			where: {
				userId: sender.id,
				blockedId: receiverId
			}
		})
	])
	.then(([receiver, blocked]) => {
		if (!receiver) throw 3;
		if (blocked) throw 4;
		return models.user.findOne({
			where: {id: sender.id},
			include: [{
				model: models.role,
				attributes: ['id'],
				include: [{
					model: models.rolepermission,
					attributes: ['roleId'],
					include: [{
						model: models.permission,
						attributes: ['id'],
						where: {model: 'chat', 'action': receiver.user_type}
					}]
				}],
				on: ["`user`.`roleId` = `role`.`id` OR \
					(`user`.`user_type` = 'parent' AND `role`.`masterId` = ? \
					AND `role`.`slug` = 'parent')", [receiver.masterId]]
				}]
		});
	})
	.then(sender => (sender !== null));
}

function sendMessage(message) {
	canSendMessage(this.user, message.receiverId)
	.then((can) => {
		if (! can) throw 2;
		return models.message.create({
			senderId: this.user.id,
			receiverId: message.receiverId,
			type: message.type || 0,
			masterId: this.user.masterId,
			data: message.data || '',
			msg_status: 1,
		});
	})
	.then(instance => {
		this.emit('message-sent', {
			status: 1, id: instance.id, uid: message.uid, createdAt: instance.createdAt
		});
		models.onlineuser.findAll({where: {userId: this.user.id}, attributes: ['id', 'socket']})
		.then(devices => {
			if (devices.length === 0) return;
			for (let i = devices.length - 1; i >= 0; i--) {
				this.to(devices[i].socket).emit('my-message', instance);
			}
		})
		.catch(console.log);

		models.chatblock.count({
			where: {
				userId: instance.receiverId,
				blockedId: this.user.id
			}
		}).then(count => {
			if (count !== 0) {
				instance.msg_status = 4;
				return instance.save();
			} else {
				return models.onlineuser.findAll({where: {userId: instance.receiverId}})
				.then(devices => {
					if (devices.length === 0) return;
					instance = instance.toJSON();
					for (let i = devices.length - 1; i >= 0; i--) {
						this.to(devices[i].socket).emit('message', instance);
					}
				});
			}
		});
	})
	.catch(err => {
		this.emit(
			'message-sent', {
				status: 0,
				error: typeof err === 'number' ? err : 0,
				uid: message.uid
			}
		)
	});
}

function startedTyping(receiverId) {
	models.onlineuser.findAll({where: {userId: receiverId}})
	.then(devices => {
		for (let i = devices.length - 1; i >= 0; i--) {
			this.to(devices[i].socket).emit('started-typing', this.user.id);
		}
	});
}

function stoppedTyping(receiverId) {
	models.onlineuser.findAll({where: {userId: receiverId}})
	.then(devices => {
		for (let i = devices.length - 1; i >= 0; i--) {
			this.to(devices[i].socket).emit('stopped-typing', this.user.id);
		}
	});
}

function messageSeen(messageId) {
	models.message.findOne({
		where: {id: messageId},
		attributes: ['id', 'msg_status'],
		include: [{
			model: models.user,
			attributes: ['id'],
			include: [{
				model: models.onlineuser,
				attributes: ['id', 'socket']
			}],
			as: 'sender'
		}]
	})
	.then(message => {
		if (!message) return;
		message.msg_status = 3;
		message.save().then(() => {
			let onlineusers = message.sender.onlineusers;
			for (let i = onlineusers.length - 1; i >= 0; i--) {
				this.to(onlineusers[i].socket).emit('seen', messageId);
			}
		})
		.catch(console.log);
	});
}

function messageReceived(messageId) {
	models.message.findOne({
		where: {id: messageId, msg_status: {$lt: 2}},
		attributes: ['id', 'msg_status'],
		include: [{
			model: models.user,
			attributes: ['id'],
			include: [{
				model: models.onlineuser,
				attributes: ['id', 'socket']
			}],
			as: 'sender'
		}]
	})
	.then(message => {
		if (!message) return;
		message.msg_status = 2;
		message.save().then(() => {
			let onlineusers = message.sender.onlineusers;
			for (let i = onlineusers.length - 1; i >= 0; i--) {
				this.to(onlineusers[i].socket).emit('received', messageId);
			}
		})
		.catch(console.log);
	});
}

function removeMessage(messageId) {
	models.message.findOne({
		where: {
			id: messageId,
			senderId: this.user.id
		}
	})
	.then(instance => {
		if (!instance) return {status: 1};
		instance.msg_status = 5;
		return instance.save()
		.then(() => {
			models.onlineuser.findAll({where: {userId: this.user.id}, attributes: ['id', 'socket']})
			.then(devices => {
				if (devices.length === 0) return;
				for (let i = devices.length - 1; i >= 0; i--) {
					this.to(devices[i].socket).emit('remove-my-message', instance);
				}
			})
			.catch(console.log);

			models.onlineuser.findAll({where: {userId: message.receiverId}})
			.then(devices => {
				if (devices.length === 0) return;
				for (let i = devices.length - 1; i >= 0; i--) {
					this.to(devices[i].socket).emit('remove-message', instance);
				}
			})
			.catch(console.log);
		});
	})
	.then(cb)
	.catch(() => cb({status: 0, error: 0}));
}

function socketDisconnect() {
	models.onlineuser.destroy({where: {socket: this.id}})
	.then(() => models.onlineuser.count({where: {userId: this.user.id}}))
	.then(count => {
		if (count !== 0) return;
		getRelatedSockets(this.user.id)
		.then(users => {
			for (let i = users.length - 1; i >= 0; i--) {
				io.sockets.to(users[i].socket).emit('offline', this.user.id);
			}
		});
	})
	.catch(console.log);
}

function isOnline(ids, cb) {
	if (! (ids instanceof Array)) {
		cb([]);
		return;
	}
	models.sequelize.query(
		'SELECT `userId` FROM `online_users` WHERE `userId` IN (:ids) AND `userId`\
		NOT IN (SELECT `userId` FROM `chat_blocks` WHERE `blockedId` = :userId) \
		GROUP BY `userId`',
		{
			type: models.sequelize.QueryTypes.SELECT,
			replacements: {
				ids,
				userId: this.user.id
			}
		}
	)
	.then(cb);
}

function getTime(cb) {
	if (! cb) return;
	models.sequelize.query('SELECT CURRENT_TIMESTAMP', {type: models.sequelize.QueryTypes.SELECT})
	.then(results => cb({
		time: Date.parse(results[0].CURRENT_TIMESTAMP),
		status: true
	}))
	.catch(console.log);
}

function block(userId, cb) {
	cb = cb || nothing;
	models.chatblock.upsert({
		userId: this.user.id,
		masterId: this.user.masterId,
		blockedId: userId
	})
	.then(() => cb({status: true}))
	.catch(console.log);
}

function unblock(userId, cb) {
	cb = cb || nothing;
	models.chatblock.destroy({
		where: {
			userId: this.user.id,
			masterId: this.user.masterId,
			blockedId: userId
		}
	})
	.then(() => cb({status: true}))
	.catch(console.log);
}

function isBlocked(userId, cb) {
	cb = cb || nothing;
	models.chatblock.findOne({
		where: {
			userId: this.user.id,
			blockedId: userId
		}
	})
	.then(blocked => cb({status: true, blocked: blocked !== null ? 1 : 0}))
	.catch(console.log);
}

function socketError() {
	models.onlineuser.destroy({where: {socket: this.id}});
}

module.exports = function (_io) {
	io = _io;
	return function (socket) {
		models.onlineuser.count({where: {userId: socket.user.id}})
		.then(count => {
			if (count !== 0) return;
			return getRelatedSockets(socket.user.id)
			.then(users => {
				for (let i = users.length - 1; i >= 0; i--) {
						socket.to(users[i].socket).emit('online', socket.user.id);
				}
			});
		})
		.then(() => models.onlineuser.create({
			userId: socket.user.id,
			masterId: socket.user.masterId,
			token: socket.handshake.headers.token,
			socket: socket.id
		})).then(() => {
			socket.on('disconnect', socketDisconnect);
			socket.on('error', socketError);
			socket.on('send-message', sendMessage);
			socket.on('started-typing', startedTyping);
			socket.on('stopped-typing', stoppedTyping);
			socket.on('seen', messageSeen);
			socket.on('received', messageReceived);
			socket.on('remove-message', removeMessage);
			socket.on('is-online', isOnline);
			socket.on('get-time', getTime);
			socket.on('block', block);
			socket.on('unblock', unblock);
			socket.on('is-blocked', isBlocked);
		});
	};
};