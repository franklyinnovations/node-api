'use strict';

const io = require('socket.io')(),
	chat = require('./chat')(io),
	models = require('../models');

io.use((socket, next) => {
	socket.handshake.headers.token = socket.handshake.headers.token ||
		socket.handshake.query.token;
	if (!socket.handshake.headers.token) {
		socket.user = null;
		next();
	} else {
		models.oauthaccesstoken.belongsTo(models.user, {foreignKey: 'user_id'});
		models.oauthaccesstoken.findOne({
			where: {access_token: socket.handshake.headers.token},
			attributes: ['access_token'],
			include: [{model: models.user, attributes: ['id', 'user_type']}]
		})
		.then(oauthaccesstoken => {
			socket.user = (oauthaccesstoken && oauthaccesstoken.user) || null;
			next();
		})
		.catch(console.log);
	}
});

io.on('connection', socket => {
	chat(socket);
	socket.on('error', console.log);
});

module.exports = function (server) {
	io.attach(server, {pingTimeout:30000 , pingInterval: 25000});
};