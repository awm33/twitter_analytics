define([
	'fs',
	'async',
	'node-uuid',
	'mongodb',
	'csv',
	'../config',
], function (fs, async, uuid, mongodb, csv, config) {
	return function (cb) {
		var fixturesDir = '../fixtures/';

		if (config.fixtures && config.fixtures.companies) {
			mongodb.MongoClient.connect('mongodb://' + 
				((config.mongodb.username) ? config.mongodb.username + ':' +
				config.mongodb.password + '@' : '') +
			    config.mongodb.host + ':' + 
			    config.mongodb.port + '/' +
			    config.mongodb.database, function (err, db) {
			    if (err) return console.log(err);

				csv()
				.from.path(fixturesDir + config.fixtures.companies)
				.to.array(function (data) {
					db.createCollection('companies', function (err, companiesCol) {
						data.splice(0,1); // remove headers

						var companies = [];
						data.forEach(function (row) {
							companies.push({
								company: row[1].trim(),
								domain: row[0].trim()
							});
						});

						companiesCol.insert(companies, { w: 1 }, function (err) {
							if (err) return cb(err);

							cb();
						});
					});
				})
				.on('error', function (err) {
					console.log(err);
				});
				
			});
		} else
			cb();
	}
});