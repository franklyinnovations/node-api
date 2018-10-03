'use strict';

/**
TODO: apply validation for status
*/

const models = require('../models'),
	nothing = (() => undefined),
	notification = require('../controllers/notification');

function joinRVDHSMapRoom(rvdhsmapId, cb = nothing) {
	this.join('rvdhsmap' + rvdhsmapId);
	cb({status: true});
}

function leaveRVDHSMapRoom(rvdhsmapId, cb = nothing) {
	this.leave('rvdhsmap' + rvdhsmapId);
	cb({status: true});
}

function joinTripRecordRoom(tripRecordId, cb = nothing) {
	this.join('triprecord' + tripRecordId);
	cb({status: true});
}

function leaveTripRecordRoom(tripRecordId, cb = nothing) {
	this.leave('triprecord' + tripRecordId);
	cb({status: true});
}

function joinTripRoom(tripId, cb = nothing) {
	this.join('trip' + tripId);
	cb({status: true});
}

function leaveTripRoom(tripId, cb = nothing) {
	this.leave('trip' + tripId);
	cb({status: true});
}

function joinTripAdminRoom(tripId, cb = nothing) {
	this.join('trip-admin' + tripId);
	cb({status: true});
}

function leaveTripAdminRoom(tripId, cb = nothing) {
	this.leave('trip-admin' + tripId);
	cb({status: true});
}

function tripPosition(position) {
	this.to('trip' + position.tripId).emit('trip-position', position);
}

async function startPickUp(tripId, cb = nothing) {
	let trip = await models.trip.findOne({where: {id: tripId, driverId: this.user.id}});
	if (trip === null) throw 'trip_not_found';
	trip.status = 1;
	trip = await trip.save();
	this.to('rvdhsmap' + trip.rvdhsmapId).emit('start-pick-up', tripId);
	cb({status: true});
	const [parents, students, [{code}]] = await Promise.all([
		models.sequelize.query(
			'SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` WHERE FIND_IN_SET\
			(`mobile`, (SELECT GROUP_CONCAT(`father_contact`,",",\
			`father_contact_alternate`,",", `mother_contact`,",",\
			`mother_contact_alternate`,",", `guardian_contact`,",",\
			`guardian_contact_alternate`) FROM `students` INNER JOIN `trip_records`\
			ON `students`.`id` = `trip_records`.`studentId` WHERE \
			`trip_records`.`tripId` = ?)) \
			AND `users`.`user_type` = "parent"',
			{replacements:[tripId], type: models.sequelize.QueryTypes.SELECT}
		),
		models.sequelize.query(
			'SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` INNER JOIN \
			`students` ON `students`.`id` = `users`.`id` INNER JOIN `trip_records`\
			ON `students`.`id` = `trip_records`.`studentId` WHERE \
			`trip_records`.`tripId` = ?',
			{replacements:[tripId], type: models.sequelize.QueryTypes.SELECT}
		),
		models.sequelize.query(
			'SELECT `languages`.`code` AS `code` FROM `languages` INNER JOIN `users` \
			ON `languages`.`id` = `users`.`default_lang` WHERE `users`.`id` = ? LIMIT 1',
			{replacements: [this.user.masterId], type: models.sequelize.QueryTypes.SELECT}
		),
	]);

	notification.send(
		parents,
		'front/notification/start-pick-up/parent',
		{
			lang: code
		},
		{
			masterId: this.user.masterId,
			senderId: this.user.id,
			data: {
				type: 'start-pick-up'
			}
		}
	);
	notification.send(
		students,
		'front/notification/start-pick-up/student',
		{
			lang: code
		},
		{
			masterId: this.user.masterId,
			senderId: this.user.id,
			data: {
				type: 'start-pick-up'
			}
		}
	);
}

async function stopPickUp(tripId, cb) {
	const trip = await models.trip.findOne({where: {id: tripId, driverId: this.user.id}});
	if (trip === null) throw 'trip_not_found';
	trip.status = 2;
	await trip.save();
	this.to('trip' + tripId).emit('stop-pick-up', tripId);
	cb({status: true});
}

async function startDrop(tripId, cb = nothing) {
	let trip = await models.trip.findOne({where: {id: tripId, driverId: this.user.id}});
	if (trip === null) throw 'trip_not_found';
	trip.status = 3;
	await trip.save();
	this.to('trip' + tripId).emit('start-drop', tripId);
	cb({status: true});
}

async function stopDrop(tripId, cb = nothing) {
	const trip = await models.trip.findOne({where: {id: tripId, driverId: this.user.id}});
	trip.status = 4;
	await trip.save();
	this.to('trip' + tripId).emit('stop-drop', tripId);
	cb({status: true});
}

async function startPickUpOnBoard(triprecordId, cb = nothing) {
	const triprecord = await models.triprecord.findById(triprecordId);
	if (triprecord === null) throw 'triprecord not found';
	triprecord.status = 1;
	triprecord.times = {...triprecord.times, 'start-pick-up-on-board': Date.now()};
	await triprecord.save();
	this.to('trip-admin' + triprecord.tripId)
		.emit('start-pick-up-on-board', triprecordId);
	cb({status: true});
}

async function confirmPickUpOnBoard(triprecordId, cb = nothing) {
	const triprecord = await models.triprecord.findById(triprecordId);
	if (triprecord === null) throw 'triprecord not found';
	triprecord.status = 2;
	triprecord.times = {...triprecord.times, 'confirm-pick-up-on-board': Date.now()};
	await triprecord.save();
	cb({status: true});
	this.to('trip-admin' + triprecord.tripId)
		.to('triprecord' + triprecordId)
		.emit('confirm-pick-up-on-board', triprecordId);
	const [users, [{code}]] = await Promise.all([
		models.sequelize.query(
			'SELECT `users`.`id`, `users`.`device_id`, `users`.`is_notification` FROM `users` WHERE FIND_IN_SET\
			(`users`.`mobile`,(SELECT GROUP_CONCAT(`father_contact`,","\
			,`father_contact_alternate`,",",`mother_contact`,",",\
			`mother_contact_alternate`,",",`guardian_contact`,",",\
			`guardian_contact_alternate`) FROM `students` WHERE `students`.`id` = ?) AND `users`.`user_type` = "parent")',
			{replacements:[triprecord.studentId], type: models.sequelize.QueryTypes.SELECT}
		),
		models.sequelize.query(
			'SELECT `languages`.`code` AS `code` FROM `languages` INNER JOIN `users` \
			ON `languages`.`id` = `users`.`default_lang` WHERE `users`.`id` = ? LIMIT 1',
			{replacements: [this.user.masterId], type: models.sequelize.QueryTypes.SELECT}
		)
	]);
	notification.send(
		users,
		'front/notification/confirm-pick-up-on-board/parent',
		{
			lang: code
		},
		{
			masterId: this.user.masterId,
			senderId: this.user.id,
			data: {
				type: 'confirm-pick-up-on-board'
			}
		}
	);
}

async function cancelPickUpOnBoard(triprecordId, cb = nothing) {
	const triprecord = await models.triprecord.findById(triprecordId);
	if (triprecord === null) throw 'triprecord not found';
	triprecord.status = 0;
	triprecord.times = {...triprecord.times, 'cancel-pick-up-on-board': Date.now()};
	await triprecord.save();
	cb({status: true});
	this.to('triprecord' + triprecordId)
		.to('trip-admin' + triprecord.tripId)
		.emit('cancel-pick-up-on-board', triprecordId);
}

async function pickUpOffBoard(triprecordId, cb = nothing) {
	const triprecord = await models.triprecord.findById(triprecordId);
	if (triprecord === null) throw 'triprecord not found';
	triprecord.status = 3;
	triprecord.times = {...triprecord.times, 'pick-up-off-board': Date.now()};
	await triprecord.save();
	cb({status: true});
	this
		.to('trip-admin' + triprecord.tripId)
		.emit('pick-up-off-board', triprecordId);
}

async function dropOnBoard(triprecordId, cb = nothing) {
	const triprecord = await models.triprecord.findById(triprecordId);
	triprecord.status = 4;
	triprecord.times = {...triprecord.times, 'drop-on-board': Date.now()};
	await triprecord.save();
	cb({status: true});
	this.to('trip-admin' + triprecord.tripId)
		.emit('drop-on-board', triprecordId);
}

async function leaveDrop(triprecordId, cb = nothing) {
	const triprecord = await models.triprecord.findById(triprecordId);
	if (triprecord === null) throw 'triprecord not found';
	triprecord.status = 5;
	triprecord.times = {...triprecord.times, 'leave-drop': Date.now()};
	await triprecord.save();
	cb({status: true});
	this.to('trip-admin' + triprecord.tripId)
		.emit('leave-drop', triprecordId);
}

async function dropOffBoard(triprecordId, cb = nothing) {
	const triprecord = await models.triprecord.findById(triprecordId);
	if (triprecord === null) throw 'triprecord not found';
	triprecord.status = 6;
	triprecord.times = {...triprecord.times, 'drop-off-board': Date.now()};
	await triprecord.save();
	cb({status: true});
	this.to('trip-admin' + triprecord.tripId)
		.emit('drop-off-board', triprecordId);
}

module.exports = function () {
	return function (socket) {
		socket.on('join-rvdhsmap-room', joinRVDHSMapRoom);
		socket.on('leave-rvdhsmap-room', leaveRVDHSMapRoom);
		socket.on('join-trip-room', joinTripRoom);
		socket.on('leave-trip-room', leaveTripRoom);
		socket.on('join-trip-admin-room', joinTripAdminRoom);
		socket.on('leave-trip-admin-room', leaveTripAdminRoom);
		socket.on('join-triprecord-room', joinTripRecordRoom);
		socket.on('leave-triprecord-room', leaveTripRecordRoom);

		socket.on('trip-position', tripPosition);
		
		socket.on('start-pick-up', startPickUp);
		socket.on('stop-pick-up', stopPickUp);
		socket.on('start-drop', startDrop);
		socket.on('stop-drop', stopDrop);

		socket.on('start-pick-up-on-board', startPickUpOnBoard);
		socket.on('confirm-pick-up-on-board', confirmPickUpOnBoard);
		socket.on('cancel-pick-up-on-board', cancelPickUpOnBoard);
		socket.on('pick-up-off-board', pickUpOffBoard);

		socket.on('drop-on-board', dropOnBoard);
		socket.on('leave-drop', leaveDrop);
		socket.on('drop-off-board', dropOffBoard);
	};
};
