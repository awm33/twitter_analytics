define([
	'express',
	'body-parser',
	'express-session',
	'helmet',
	'http',
	'node-uuid',
	'mongodb',
	'./bootstrap',
	'./models/models',
	'./routes/app',
	'../config'
], function (express, bodyParser, session, helmet, http, uuid, mongodb, bootstrap, models, appRoutes, config) {
	return function (cb) {
		var app = express();

		app.disable('x-powered-by');

        app.use(express.static('./public'));
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended:true }));
		//app.use(helmet.cacheControl());
		app.use(function (err, req, res, next) {
			console.log(err);
			//log.error(err, req.session.user._id, null, req.correlationId);
			res.statusCode = 500;
			res.json({ error: 'Internal Server Error', correlationId: req.correlationId });
			// TODO: add switch for html depending on request / accepted MIME type
		});

		mongodb.MongoClient.connect('mongodb://127.0.0.1:27017/twitter4', function(err, db) {
			if (err) return console.log(err);

			app.use(function (req, res, next){
				req.db = db;
				next();
			});

			appRoutes(app);

			app.start = function () {
				app.listen(config.http.port);
			}

			bootstrap(function () {
				cb && cb(app);
			});
		});
	}
});