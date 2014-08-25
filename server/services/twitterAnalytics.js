define([
], function () {
	// company name - positive :) +2
	var posRegex = /^.* :\)$/

	// company name exact +5
	var exactRegex = /^".*"$/;

	// company name exact - positive :) + 10
	var exactPosRegex = /^".*" :\)$/;

	// to company handle +2
	var toRegex = /^to:.*$/;

	// to company handle - positive :) +5
	var toPosRegex = /^to:.* :\)$/;

	return {
		scoreTweet: function (company, tweet) {
			var query = tweet.q;
			var score = 1;

			var name = company.company;

			// users with company info in profile
			if (tweet.user.description.indexOf(name) > -1)
				score += 10;

			if (tweet.user.entities.url && tweet.user.entities.url.urls)
				tweet.user.entities.url.urls.forEach(function (url) {
					if (url.expanded_url && url.expanded_url.indexOf(company.domain) > -1)
						score += 10;
				});

			if (posRegex.test(query.q))
				score += 2;
			else if (exactRegex.test(query.q))
				score += 5;
			else if (exactPosRegex.test(query.q))
				score += 10;
			else if (toRegex.test(query.q))
				score += 2;
			else if (toPosRegex.test(query.q))
				score += 5;

			return score;
		}
	}
});