define([
	'async',
	'./websiteMiner',
	'./twitterMiner',
	'../../config'
], function (async, websiteMiner, twitterMiner, config) {
	return function (db) {

		twitterMiner = twitterMiner(db);

		function getCompanyHandle (company) {
			var twitterHandle;
			var maxNum = 0;
			Object.keys(company.twitterHandles).forEach(function (key) {
				var value = company.twitterHandles[key];
				if (value > maxNum) {
					maxNum = value;
					twitterHandle = key;
				}
			});

			return twitterHandle;
		}

		function twitterRun (company) {
			// company name
			twitterMiner.search(company.company);

			// company name - positive :)
			twitterMiner.search(company.company + ' :)');

			// company name exact
			twitterMiner.search('"' + company.company + '"');

			// company name exact - positive :)
			twitterMiner.search('"' + company.company + '" :)');

			if (company.twitterHandles) {
				var twitterHandle = getCompanyHandle(company);

				// to company handle
				twitterMiner.search('to:' + twitterHandle);

				// to company handle - positive :)
				twitterMiner.search('to:' + twitterHandle + ' :)');
			}
		}

		function minerRun (cb) {
			db.collection('companies', function (err, companiesCol) {
				companiesCol.find().toArray(function (err, companies) {

					async.each(companies,
						function (company, callback) {
							console.log('Mining ' + company.company + ' website');

							websiteMiner.findTwitterHandles(companiesCol, company.company, company.domain,
								function (err) {
									if (err) return callback(err);

									console.log('Mining ' + company.company + ' twitter');
									twitterRun(company);

									callback();
								});
						},
						function (err) {
							if (err) return cb(err);

							cb();
						});
				})
			})
		}

		return {
			run: function (cb) {
				console.log('Miner Starting...');
				minerRun(cb);
			}
		}
	}
});