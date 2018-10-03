'use strict';

const
	io = require('socket.io')(),
	models = require('../models'),
	chat = require('./chat')(io),
	transport = require('./transport')(io);


io.use((socket, next) => {
	socket.handshake.headers.token = socket.handshake.headers.token ||
		socket.handshake.query.token;
	if (!socket.handshake.headers.token) {
		next(new Error('INVALID_ACCESS_TOKEN'));
	} else {
		models.oauthaccesstoken.belongsTo(models.user, {foreignKey: 'user_id'});
		models.oauthaccesstoken.findOne({
			where: {access_token: socket.handshake.headers.token},
			attributes: ['access_token'],
			include: [{model: models.user, attributes: ['id', 'masterId', 'user_type']}]
		})
			.then(oauthaccesstoken => {
				socket.user = (oauthaccesstoken && oauthaccesstoken.user) || null;
				if (socket.user === null)
					next(new Error('INVALID_ACCESS_TOKEN'));
				else
					next();
			})
			.catch(console.log);
	}
});

io.on('connection', chat);
io.on('connection', transport);

module.exports = function (server) {
	io.attach(server);
};