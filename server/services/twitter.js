define([
	'async',
	'twit',
	'querystring'
], function (async, twit, qs) {
	return function (db, users) {
		var t = new twit({
			consumer_key: 'N3ewCDOGpTwfu22yEHdUhdYbT',
			consumer_secret: 'SEVK9IeOD2mfUKY7phoYVSffvTcPEehzMAmUWigkDEPjQjOy7t',
			access_token: '2751000948-2mgJXUxLQbL1jPfQ2zdWaV5JZoH12qbBmizYhj6',
			access_token_secret: '0iCZIEesfH6PDJ4qldve4tP5NeBoMEQc19jsL173kJqxC'
		});

		var RateLimit = (function() {
		  var RateLimit = function(maxOps, interval, allowBursts) {
		    this._maxRate = allowBursts ? maxOps : maxOps / interval;
		    this._interval = interval;
		    this._allowBursts = allowBursts;

		    this._numOps = 0;
		    this._start = new Date().getTime();
		    this._queue = [];
		  };

		  RateLimit.prototype.schedule = function(fn) {
		    var that = this,
		        rate = 0,
		        now = new Date().getTime(),
		        elapsed = now - this._start;

		    if (elapsed > this._interval) {
		      this._numOps = 0;
		      this._start = now;
		    }

		    rate = this._numOps / (this._allowBursts ? 1 : elapsed);

		    if (rate < this._maxRate) {
		      if (this._queue.length === 0) {
		        this._numOps++;
		        fn();
		      }
		      else {
		        if (fn) this._queue.push(fn);

		        this._numOps++;
		        this._queue.shift()();
		      }
		    }
		    else {
		      if (fn) this._queue.push(fn);

		      setTimeout(function() {
		        that.schedule();
		      }, 1 / this._maxRate);
		    }
		  };

		  return RateLimit;
		})();

		var followerLimiter = new RateLimit(15, 900000, false);

		var userLimiter = new RateLimit(60, 900000, false);

		var timelineLimiter = new RateLimit(180, 900000, false);

		var favoritesLimiter = new RateLimit(15, 900000, false);

		var retweeterLimiter = new RateLimit(15, 900000, false);

		var searchLimiter = new RateLimit(180, 900000, false);

		function getFollowers(screenName, cursor, cb) {
			if (typeof cursor === 'function')
				cb = cursor;

			followerLimiter.schedule(function () {
				var opts = { screen_name: screenName };

				if (cursor && typeof cursor === 'string')
					opts.cursor = cursor;

				t.get('followers/ids', opts, function (err, data) {
					console.log(data);
					if (err) return cb(err);

					users.findOne({ screen_name: screenName }, function (err, account) {
						if (err) return cb(err);

						var ids = [];
						data.ids.forEach(function (id) {
							ids.push(id.toString());
						});

						var lookup, stored;
						if (account) {
							lookup = [], stored = account.followers.slice(0);
							ids.forEach(function (newId) {
								if (stored.indexOf(newId) === -1) {
									lookup.push(newId);
									stored.push(newId);
								}
							});
						} else {
							lookup = ids;
							stored = ids;
						}

						users.update({ screen_name: screenName },
										  { screen_name: screenName, followers: stored },
										  { w: 1, upsert: true },
										  function (err) {
										  	if (err) return cb(err);

										  	if (data.next_cursor_str && data.next_cursor_str != '0')
										  		getFollowers(screenName, data.next_cursor_str, cb);
										  	else
										  		cb();
										  });

						fetchUsers(lookup);
					});
				});
			});
		}

		var userLookups = [];
		var lastAdd;

		function fetchUserBatch (lookup) {
			userLimiter.schedule(function () {
				t.get('users/lookup', { user_id: lookup, include_entities: true }, function (err, data) {
					if (err) return console.log(err);

					async.each(data,
						function (account, callback) {
							users.update({ id: account.id },
											  account,
											  { w: 1, upsert: true },
											  function (err) {
											  	if (err) return callback(err);

											  	callback();
											  });
						},
						function (err) {
							if (err) console.log(err);
						});
				});
			});
		}

		function batchUsers (sendAll) {
			while (userLookups.length >= 100)
			  	fetchUserBatch(userLookups.splice(0, 100));

			if (sendAll && userLookups.length > 0)
			 	fetchUserBatch(userLookups.splice(0));
		}

		function addUsers(ids) {
			if (lastAdd)
				clearTimeout(lastAdd);

			ids.forEach(function (id) {
				if (userLookups.indexOf(id) === -1)
					userLookups.push(id);
			});

			if (userLookups.length >= 100) {
				batchUsers();
			}

			if (userLookups.length > 0) {
				lastAdd = setTimeout(function () {
					batchUsers(true);
				}, 1000);
			}
		}

		function fetchUsers(ids) {
			users.find({ id_str: { $in: ids } }).toArray(function (err, accounts) {
				if (err) return cb(err);

				var fetchedIds = [];
				accounts.forEach(function (account) {
					fetchedIds.push(account.id);
				});

				var lookup = [];
				ids.forEach(function (id) {
					if (fetchedIds.indexOf(id) === -1)
						lookup.push(id);
				});

				addUsers(lookup);
			});
		}

		function fetchUserTimelines() {
			db.createCollection('tweets', function (err, tweets) {
				if (err) return console.log(err);

				users.find({}, { fields: { id_str: true } }).each(function (err, user) {
					if (err) return console.log(err);

					if (!user) return;

					tweets.count({ 'user.id_str': user.id_str }, function (err, count) {
						if (err) return console.log(err);

						if (count === 0)
							timelineLimiter.schedule(function () {
								t.get('statuses/user_timeline', {
														user_id: user.id_str,
														count: 200,
														trim_user: true,
														contributor_details: true,
														include_rts: true },
									function (err, data) {
										if (err) return console.log(err);

										if (data && data.length > 0)
											tweets.insert(data, { w: 1 }, function (err) {
												if (err) console.log(err);
											});
									});
							});
					});
				});
			});
		}

		function fetchFavorites() {
			db.createCollection('favorites', function (err, favorites) {
				if (err) return console.log(err);

				users.find({}, { fields: { id_str: true } }).each(function (err, user) {
					if (err) return console.log(err);

					if (!user) return;

					favoritesLimiter.schedule(function () {
						t.get('favorites/list', {
												user_id: user.id_str,
												count: 200,
												include_entities: true },
							function (err, data) {
								if (err) return console.log(err);

								if (data && data.length > 0)
									favorites.insert(data, { w: 1 }, function (err) {
										if (err) console.log(err);
									});
							});
					});
				});
			});
		}

		function _fetchRetweeters(retweeters, id, cursor) {
			retweeterLimiter.schedule(function () {
				var opts = {
					id: id,
					stringify_ids: true
				}

				if (cursor)
					opts.cursor = cursor;

				t.get('statuses/retweeters/ids', opts,
					function (err, data) {
						if (err) return console.log(err);

						if (data && data.ids && data.ids.length > 0) {
							retweeters.findOne({ tweet_id_str: id }, function (err, retweeter) {
								if (err) return console.log(err);

								var newIds;
								if (retweeter && retweeter.retweeters)
									newIds = retweeter.retweeters;
								else
									newIds = [];

								data.ids.forEach(function (id) {
									if (newIds.indexOf(id) === -1)
										newIds.push(id);
								});

								retweeters.update({ tweet_id_str: id },
												 { tweet_id_str: id,  retweeters: newIds }, 
												 { w: 1, upsert: true },
									function (err) {
										if (err) console.log(err);

										if (data.next_cursor_str && data.next_cursor_str != '0')
											_fetchRetweeters(id, data.next_cursor_str);
								});
							});
						}
					});
			});
		}

		function fetchRetweeters() {
			db.collection('tweets', function (err, tweets) {
				if (err) return console.log(err);

				db.createCollection('retweeters', function (err, retweeters) {
					if (err) return console.log(err);

					tweets.find({ retweet_count: { $gt: 0 } },
								{ fields: { id_str: true } }).each(function (err, tweet) {
						if (err) return console.log(err);

						if (!tweet) return;

						_fetchRetweeters(retweeters, tweet.id_str);
					});
				});
			});
		}

		function _searchCompanyName(tweets, companyName, max_id) {
			searchLimiter.schedule(function () {
				var opts = {
					q: companyName + ' :)', // find positive tweets with company name
					include_entities: true
				}

				if (max_id)
					opts.max_id = max_id;

				t.get('search/tweets', opts,
					function (err, data) {
						if (err) return console.log(err);

						if (data && data.statuses && data.statuses.length > 0) {
								var time = new Date();

								data.statuses.forEach(function (tweet) {
									tweet.q = { companyName: companyName, time: time };
								});

								if (data.next_results)
									max_id = qs.parse(data.next_results).max_id;
								else
									max_id = null;

								tweets.insert(data.statuses,
											{ w: 1 },
									function (err) {
										if (err) console.log(err);

										if (max_id)
											_searchCompanyName(tweets, companyName, max_id);
								});
						}
				});
			});
		}

		function searchCompanyName(companyName) {
			db.createCollection('tweets', function (err, tweets) {
				if (err) return console.log(err);

				_searchCompanyName(tweets, companyName);
			});
		}

		return {
			followers: function (screenName, cb) {
				getFollowers(screenName, cb);
			},
			searchCompanyName: function (companyName) {
				searchCompanyName(companyName);
			},
			fetchUserTimelines: function () {
				fetchUserTimelines();
			},
			fetchFavorites: function () {
				fetchFavorites();
			},
			fetchRetweeters: function () {
				fetchRetweeters();
			},
			rateLimitStatus: function () {
				t.get('application/rate_limit_status', function (err, status) {
					console.log(JSON.stringify(status));
				});
			}
		}
	}
});