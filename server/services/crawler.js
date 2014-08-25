define([
	'simplecrawler',
	'cheerio',
	'mongodb',
	'request'
], function (Crawler, cheerio, mongodb, request) {

	return {
		findTwitter: function (collection, company, domain, cb) {
			/*var crawler = Crawler.crawl('http://' + domain);

			crawler.queueURL('http://' + domain);
			crawler.queueURL('https://' + domain);
			crawler.queueURL('http://blog.' + domain);
			crawler.queueURL('https://blog.' + domain);

			//console.log(crawler.queue)

			crawler.scanSubdomains = false;
			crawler.downloadUnsupported = false;
			crawler.maxConcurrency = 20;
			crawler.discoverResources = false;

			crawler.userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

			crawler.addFetchCondition(function(parsedURL) {
				return !parsedURL.path.match(/\.(ppt|css|js|pdf|jpg|jpeg|png|gif)$/i);
			});*/

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
				if (err) return console.log(err);
				
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

			/*crawler.on("fetchcomplete",function(queueItem, responseBuffer, response){
				console.log('Fetch Complete: ' + queueItem.url);

				if (queueItem && queueItem.stateData && queueItem.stateData.contentType &&
						queueItem.stateData.contentType.indexOf('text/html') > -1) {
					var $ = cheerio.load(responseBuffer.toString());

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
			});

			crawler.on('complete', function () {
				console.log('Crawl complete');
				cb && cb();
			});

			crawler.save = function (cb) {
				crawler.queue.freeze('./crawls/' + domain + '.json', cb);
			}

			crawler.restore = function (filename, cb) {
				crawler.queue.defrost(filename);
			}

			return crawler;*/
		}
	}
});