#!/usr/bin/env node
var requirejs = require('requirejs');

requirejs.config({
    nodeRequire: require
});

requirejs([
	'csv',
	'mongodb',
	'async',
	'./services/twitter',
	'./services/crawler'
], function (csv, mongodb, async, twitter, crawler) {
	csv()
	.from.path('../fixtures/sample_companies.csv')
	.to.array(function (data) {
		console.log(data)

		mongodb.MongoClient.connect('mongodb://127.0.0.1:27017/twitter3', function(err, db) {
			if (err) return console.log(err);

			// crawl sites
			db.createCollection('companies', function (err, companiesCol) {
				if (err) return console.log(err);

				/*var q = async.queue(function (item, callback) {
					crawler.findTwitter(companiesCol, item[1].trim(), item[0].trim().toLowerCase(), function (err, twitterHandles) {
						callback();
					});
				}, 20);

				q.drain = function() {
					console.log('all items have been processed');
				}

				q.push(data);*/				

				db.createCollection('accounts', function (err, accountsCol) {
					if (err) return console.log(err);

					twitter = twitter(db, accountsCol);

					companiesCol.find().each(function (err, company) {
						if (err) return console.log(err);

						if (!company) return;

						twitter.searchCompanyName(company.company);
					});

					//twitter.rateLimitStatus();

					//twitter.fetchUserTimelines();

					//twitter.fetchFavorites();

					//twitter.fetchRetweeters();

					/*companiesCol.find().toArray(function (err, companies) {
						if (err) return console.log(err);

						async.each(companies,
							function (company, callback) {
								var twitterHandle;

								var maxNum = 0;
								Object.keys(company.twitterHandles).forEach(function (key) {
									var value = company.twitterHandles[key];
									if (value > maxNum) {
										maxNum = value;
										twitterHandle = key;
									}
								});
console.log(twitterHandle);
								twitter.followers(twitterHandle, callback);
							},
							function (err) {
								if (err) return console.log(err);
							});
					});*/
				});
			});
		});
	})
	.on('error', function (err) {
		console.log(err);
	});
});