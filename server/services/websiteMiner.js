define([
	'cheerio',
	'request'
], function (cheerio, request) {
	function findTwitterHandles (collection, company, domain, cb) {
		var twitterRegex = /twitter\.com\/(#!\/)?([^\/]+)(\/\w+)*/;

		var invalidHandles = [
			'share',
			'search',
			'intent',
			'home'
		];

		function addHandle (handle, cb) {
			var q = {}; q['twitterHandles.' + handle] = 1;

			collection.update({ company: company, domain: domain },
							  { $inc: q },
							  { w: 1, upsert: true },
							  cb);
		}

		request('http://' + domain, function (err, response, body) {
			if (err) console.log(err);
			
			if (!err && response.statusCode == 200) {
				var $ = cheerio.load(body);

				$('[href]').each(function () {
					var href = $(this).attr('href').split("?")[0];
					if (twitterRegex.test(href)) {
						var handle = twitterRegex.exec(href)[2].toLowerCase();
						if (invalidHandles.indexOf(handle) === -1) {
							console.log(handle);
							addHandle(handle, function (err) {
								if (err) console.log(err);
							});
						}
					}
				});
			}

			cb && cb();
		});
	}

	return {
		findTwitterHandles: function (collection, company, domain, cb) {
			findTwitterHandles(collection, company, domain, cb);
		}
	}
});