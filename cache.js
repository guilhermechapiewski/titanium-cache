/***************************************************
Titanium Cache, by Guilherme Chapiewski - http://guilherme.it

This is a simple Cache implementation for Titanium that uses local SQLite
database to cache strings and JavaScript objects.

More info at http://github.com/guilhermechapiewski/titanium-cache#readme

Usage:
	// the following call will return null
	Ti.Cache.get('my_data');

	// now we'll cache object under "my_data" key for 5 minutes
	// (if you do not specify, the default cache time is 5 minutes)
	var my_javascript_object = { property: 'value' };
	Ti.Cache.put('my_data', my_javascript_object);

	// returns cached object
	var cached_obj = Ti.Cache.get('my_data');

	// cache another object (a xml document) for 1 hour
	// (you can specify different cache expiration times then 5 minutes)
	Ti.Cache.put('another_data', xml_document, 3600);

	// the following call will delete an object from cache
	Ti.Cache.del('my_data');
***************************************************/

var DELETE_ON_GET = true;

(function(){
	
	var config = {
		disable: false,
		cache_expiration_interval: 60
	};
	
	Ti.Cache = function() {
		var init_cache, expire_cache, current_timestamp, get, put, del;

		// Cache initialization
		init_cache = function(cache_expiration_interval) {
			var db = Titanium.Database.open('cache');
			db.execute('CREATE TABLE IF NOT EXISTS cache (key TEXT UNIQUE, value TEXT, expiration INTEGER)');
			db.close();
			Ti.API.info('CACHE INITIALIZED (expiring objects each ' + cache_expiration_interval + ' seconds)');

			// set cache expiration task
			setInterval(expire_cache, cache_expiration_interval * 1000);
		};

		expire_cache = function() {
			var db = Titanium.Database.open('cache');
			var timestamp = current_timestamp();

			// count how many objects will be deleted
			var count = 0;
		    var rs = db.execute('SELECT COUNT(*) FROM cache WHERE expiration <= ?', timestamp);
		    while (rs.isValidRow()) {
		        count = rs.field(0);
		        rs.next();
		    }
		    rs.close();

			// deletes everything older than timestamp
			db.execute('DELETE FROM cache WHERE expiration <= ?', timestamp);
			db.close();

			Ti.API.debug('CACHE EXPIRATION: [' + count + '] object(s) expired');
		};

		current_timestamp = function() {
			var value = Math.floor(new Date().getTime() / 1000);
			Ti.API.debug("CACHE current_timestamp = "+value);
			return value;
		};

		get = function(key) {
			var db = Titanium.Database.open('cache');
			if (DELETE_ON_GET) {
				Ti.API.debug("CACHE DELETE_ON_GET");
				db.execute('CREATE TABLE IF NOT EXISTS cache (key TEXT UNIQUE, value TEXT, expiration INTEGER)');
				db.execute('DELETE FROM cache WHERE expiration <= ?', current_timestamp());
			}
			var rs = db.execute('SELECT value FROM cache WHERE key = ?', key);
			var result = null;
			if (rs.isValidRow()) {
				Ti.API.info('CACHE HIT! key[' + key + ']');
				result = JSON.parse(rs.fieldByName('value'));
			} else {
				Ti.API.info('CACHE MISS key[' + key + ']');				
			}
			rs.close();
			db.close();
			return result;
		};

		put = function(key, value, expiration_seconds) {
			if (!expiration_seconds) {
				expiration_seconds = 300;
			}
			var expires_in = current_timestamp() + expiration_seconds;
			var db = Titanium.Database.open('cache');
			Ti.API.info('CACHE PUT: current = '+current_timestamp()+' expires_in = '+expires_in);
			var query = 'INSERT OR REPLACE INTO cache (key, value, expiration) VALUES (?, ?, ?);';
			db.execute(query, key, JSON.stringify(value), expires_in);
			db.close();
		};

		del = function(key) {
			var db = Titanium.Database.open('cache');
			db.execute('DELETE FROM cache WHERE key = ?', key);
			db.close();
		};

		return function(options) {
			// if development environment, disable cache capabilities
			if (options && options.disable) {
				return {
					get: function(){},
					put: function(){},
					del: function(){}
				};
			}

			// initialize everything
			var cache_expiration_interval = 30;
			if (options && options.cache_expiration_interval) {
				cache_expiration_interval = options.cache_expiration_interval;
			}

			if (! DELETE_ON_GET) {
				init_cache(cache_expiration_interval);
			}

			return {
				get: get,
				put: put,
				del: del
			};
		}(config);
		
	}();
	
})();