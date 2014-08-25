define([
	'../controllers/home'
], function (home) {
	return function (app) {
		app.get('/', home.get);

		app.get('/companies', home.getCompanies);

		app.get('/companies/:id/handles', home.getCompanyTwitterData);
	}
});