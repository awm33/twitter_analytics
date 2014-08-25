define([
	'fs'
], function (fs) {
	function update(obj/*, …*/) {
		for (var i=1; i<arguments.length; i++) {
			for (var prop in arguments[i]) {
				var val = arguments[i][prop];
				if (typeof val == "object") // this also applies to arrays or null!
					update(obj[prop], val);
				else
					obj[prop] = val;
			}
		}
		return obj;
	}

	function evalConfig (config) {
		return eval('function load() { return { ' + config + ' } } load()');
	}

	var baseConfig = fs.readFileSync('./config', { encoding: 'utf8' });

	var configs = evalConfig(baseConfig);

	if (process.env.NODE_CONFIG) {
		var optional = fs.readFileSync(process.env.NODE_CONFIG, { encoding: 'utf8' });

		var optionalConfigs = evalConfig(optional);
		//update(configs, optionalConfigs);
		configs = optionalConfigs;
	}

	// detect environment, default to development if not set
	switch (process.env.NODE_ENV) {
        case 'development':
            return configs.development;
            break;
        case 'testing': 
        	return configs.testing;
        	break;
        case 'stagging':
            return configs.stagging;
            break;
        case 'production':
        	return configs.production;
        	break;
        default:
        	return configs.development;
        	break;
    }
});