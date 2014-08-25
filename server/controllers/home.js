define([
	'mongodb',
	'../services/twitterAnalytics'
], function (mongodb, twitterAnalytics) {
	var ObjectId = mongodb.ObjectID

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

	return {
		get: function (req, res, next) {
			res.sendfile('./public/index.html');
		},
		getCompanies: function (req, res, next) {
			req.db.collection('companies', function (err, companiesCol) {
				if (err) return next(err);

				companiesCol.find().toArray(function (err, companies) {
					if (err) return next(err);

					companies.forEach(function (company) {
						if (company.twitterHandles) {
							var twitterHandle;
							var maxNum = 0;
							Object.keys(company.twitterHandles).forEach(function (key) {
								var value = company.twitterHandles[key];
								if (value > maxNum) {
									maxNum = value;
									twitterHandle = key;
								}
							});

							company.twitterHandle = twitterHandle
							delete company.twitterHandles;
						}
					});

					res.json(companies);
				});
			});
		},
		getCompanyTwitterData: function  (req, res, next) {
			if (!req.params.id) {
				res.statusCode = 400;
				return res.end();
			}

			req.db.collection('companies', function (err, companiesCol) {
				if (err) return next(err);

				companiesCol.findOne({ _id: new ObjectId(req.params.id) }, function (err, company) {
					if (err) return next(err);
				
					if (!company) {
						res.statusCode = 404;
						return res.end();
					}

					req.db.collection('tweets', function (err, tweetsCol) {
						if (err) return next(err);

						var q = { 'q.q': new RegExp('.*' + company.company + '.*') };

						if (company.twitterHandles)
							q['user.screen_name'] = { $ne: getCompanyHandle(company) } ;

						tweetsCol.find(q).toArray(function (err, results) {
							if (err) return next(err);

							var screenNames = {};
							results.forEach(function (tweet) {
								//tweet.score = twitterAnalytics.scoreTweet(company, tweet);
								if (!screenNames[tweet.user.screen_name])
									screenNames[tweet.user.screen_name] = 0;

								screenNames[tweet.user.screen_name] += twitterAnalytics.scoreTweet(company, tweet);
							});

							var rtn = [];
							for (var i in screenNames) {
								rtn.push({
									screen_name: i,
									score: screenNames[i]
								});
							}

							res.json(rtn);
						});
					});
				});
			});
		}
	}
});