#!/usr/bin/env node
var requirejs = require('requirejs');

requirejs.config({
    nodeRequire: require
});

requirejs([
	'mongodb',
	'./services/miner',
	'./bootstrap',
	'../config'
], function (mongodb, miner, bootstrap, config) {
	mongodb.MongoClient.connect('mongodb://' + 
		((config.mongodb.username) ? config.mongodb.username + ':' +
		config.mongodb.password + '@' : '') +
		config.mongodb.host + ':' + 
		config.mongodb.port + '/' +
		config.mongodb.database, function (err, db) {
			if (err) return console.log(err);

			bootstrap(function (err) {
				if (err) return console.log(err);

				miner = miner(db);

				miner.run(function (err) {
					if (err) console.log(err);
				});
			});
	});
});