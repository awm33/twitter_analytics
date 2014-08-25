define([
	'async',
	'mtwitter',
	'querystring',
	'./RateLimit',
	'../../config'
], function (async, Twitter, qs, RateLimit, config) {
	return function (db) {
		var t = new Twitter({
			consumer_key: config.twitter.consumer_key,
			consumer_secret: config.twitter.consumer_secret,
			application_only: true,
			skipQueue: true // built-in queue has issues?
		});

		var searchLimiter = new RateLimit(450, 900000, false); // 15 min window

		function _search(tweets, q, max_id) {
			searchLimiter.schedule(function () {
				var opts = {
					q: q,
					include_entities: true
				}

				if (max_id) {
					console.log('paging');
					opts.max_id = max_id;
				}

				t.get('search/tweets', opts,
					function (err, data) {
						if (err) return console.log(err);

						if (data && data.statuses && data.statuses.length > 0) {
								var time = new Date();

								data.statuses.forEach(function (tweet) {
									tweet.q = { q: q, time: time };
								});

								if (data.search_metadata.next_results)
									max_id = qs.parse(data.search_metadata.next_results).max_id;
								else
									max_id = null;

								tweets.insert(data.statuses,
											{ w: 1 },
									function (err) {
										if (err) console.log(err);

										if (max_id)
											_search(tweets, q, max_id);
								});
						}
				});
			});
		}

		function search(q) {
			db.createCollection('tweets', function (err, tweets) {
				if (err) return console.log(err);

				_search(tweets, q);
			});
		}

		return {
			search: function (q) {
				search(q);
			}
		}
	}
});