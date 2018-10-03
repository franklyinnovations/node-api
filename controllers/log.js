'use strict';

const
	{inspect} = require('util'),
	language = require('./language');

module.exports = function (req, err) {
	if (req && req.originalUrl) {
		console.error(req.originalUrl, req.headers, req.body);
	} else {
		console.error(JSON.stringify(req));
	}
	console.error(err.stack || err || 'Unknown Error');
	return {
		status: false,
		error: true,
		error_description: language.lang({key: "Internal Error", lang: req.lang}),
		url: true,
		code: 500,
	};
};

const inspectOptions = {
	colors: true,
};

module.exports.inspect = (...args) => {
	if (args.length === 1) {
		console.log(inspect(args[0], inspectOptions));
	}
	for (let i = 1; i < args.length; i++)
		console.log(inspect(args[i], inspectOptions))
	return args[0];
};

module.exports.log = (...args) => {
	if (args.length === 1) {
		console.log(args[0]);
	}
	for (let i = 1; i < args.length; i++)
		console.log(args[i]);
	return args[0];
};

