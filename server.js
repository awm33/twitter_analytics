#!/usr/bin/env node
var requirejs = require('requirejs');

requirejs.config({
    nodeRequire: require
});

requirejs([
    './server/app'
], function (App) {
	// start app
	new App(function (app) {
		app.start();
	});
});