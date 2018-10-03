'use strict';

const reports = require('../../controllers/reports'),
	log = require('../../controllers/log'),
	router = require('express').Router(),
	oauth = require('../../config/oauth').oauth,
	authorise = oauth.authorise(),
	auth = require('../../config/auth');

router.post('/teacher-schedule', authorise, (req, res) => {
	req.roleAccess = {model:'mark', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(reports.teacherSchedule(req.body))
			.then(teachers => res.send({status: true, teachers}))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/assignment', authorise, (req, res) => {
	req.roleAccess = {model:'assignment', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(reports.assignmentReport(req.body))
			.then(teachers => res.send({status: true, teachers}))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/emp-leave', authorise, (req, res) => {
	req.roleAccess = {model:'empleave', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(reports.empLeaveReport(req.body))
			.then(users => res.send({status: true, users}))
			.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/student', authorise, (req, res) => {
	req.roleAccess = {model:'student', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(reports.student(req.body))
				.then(students => res.send({status: true, students}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/dashboard', authorise, (req, res) => {
	req.roleAccess = {model:'dashboard', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(reports.dashboard(req.body))
				.then(([assignments, attendance, marks]) => res.send({
					status: true,
					attendance,
					assignments,
					marks,
				}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/dashboard-new', authorise, (req, res) => {
	req.roleAccess = {model:'dashboard', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(reports.dashboard(req.body))
				.then(
					([[assignmentdata, assignmentdatabcsmap, pendingassignmentsubjects], [classreportsdata, classreportsdatabcsmap], attendances, [totalpresentteacher,absentteachersrecord],upcomingempleaves, fees, [teachers,teacherSchedules]]) => res.send({
						status: true,
						fees,
						attendances,
						assignmentdata,
						assignmentdatabcsmap,
						pendingassignmentsubjects,
						classreportsdata,
						classreportsdatabcsmap,
						totalpresentteacher,
						absentteachersrecord,
						upcomingempleaves,
						teachers,
						teacherSchedules,
					}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/dashboard-assignments', authorise, (req, res) => {
	req.roleAccess = {model:'dashboard', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(reports.dashboardAssignments(req.body))
				.then(([assignmentdata, assignmentdatabcsmap, pendingassignmentsubjects]) => res.send({
					status: true,
					assignmentdata,
					assignmentdatabcsmap,
					pendingassignmentsubjects
				}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/dashboard-teacherschedule', authorise, (req, res) => {
	req.roleAccess = {model:'dashboard', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(reports.teacherDailySchedules(req.body))
				.then(([teachers, teacherSchedules]) => res.send({
					status: true,
					teachers,
					teacherSchedules,
				}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/dashboard-classreports', authorise, (req, res) => {
	req.roleAccess = {model:'dashboard', action:'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(reports.dashboardClassReports(req.body))
				.then(([classreportsdata, classreportsdatabcsmap]) => res.send({
					status: true,
					classreportsdata,
					classreportsdatabcsmap,
				}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/dashboard-attendance', authorise, (req, res) => {
	req.roleAccess = {model: 'dashboard', action: 'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(reports.dashboardAttendance(req.body))
				.then(attendances => res.send({status: true, attendances}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/teacherClasses', authorise, (req, res) => {
	req.roleAccess = {model: 'dashboard', action: 'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(reports.teacherClasses(req.body))
				.then(teacherclasses => res.send({status: true, teacherclasses}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/upcomingLeavesById', authorise, (req, res) => {
	req.roleAccess = {model: 'dashboard', action: 'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(reports.upcomingLeavesById(req.body))
				.then(upcomingproxy => res.send({status: true, upcomingproxy}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/dashboard-marks', authorise, (req, res) => {
	req.roleAccess = {model: 'dashboard', action: 'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(reports.dashboardMarks(req.body))
				.then(marks => res.send({status: true, marks}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/teacher-performance', authorise, (req, res) => {
	req.roleAccess = {model: 'greensheet', action: 'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(reports.teacherPerformance)
				.then(data => res.send({status: true, data}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/dashboard-fee', authorise, (req, res) => {
	req.roleAccess = {model: 'dashboard', action: 'view'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			Promise.resolve(req.body)
				.then(reports.totalfees)
				.then(data => res.send({status: true, data}))
				.catch(err => res.send(log(req, err)));
		} else {
			res.send(isPermission);
		}
	});
});

router.use(oauth.errorHandler());
module.exports = router;