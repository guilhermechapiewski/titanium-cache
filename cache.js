/***************************************************
Titanium Cache, by Guilherme Chapiewski - http://guilherme.it
CommonJS fork by Juan G. Hurtado (juan.g.hurtado@gmail.com)

This is a simple Cache implementation for Titanium that uses local SQLite
database to cache strings and JavaScript objects.

More info at http://github.com/juanghurtado/titanium-cache#readme

Usage:
	var Cache = require('path/to/cache');

	// the following call will return null
	Cache.get('my_data');

	// now we'll cache object under "my_data" key for 5 minutes
	// (if you do not specify, the default cache time is 5 minutes)
	var my_javascript_object = { property: 'value' };
	Cache.put('my_data', my_javascript_object);

	// returns cached object
	var cached_obj = Ti.App.Cache.get('my_data');

	// cache another object (a xml document) for 1 hour
	// (you can specify different cache expiration times then 5 minutes)
	Cache.put('another_data', xml_document, 3600);

	// the following call will delete an object from cache
	Cache.del('my_data');
***************************************************/

var CONFIG = {
	// Disables cache (useful during development).
	DISABLE: false,

	// Time to check for objects that will be expired.
	// Will check each CACHE_EXPIRATION_INTERVAL seconds.
	CACHE_EXPIRATION_INTERVAL: 60,

	// This will avoid the cache expiration task to be set up
	// and will expire objects from cache before get.
	EXPIRE_ON_GET: false
};

// Cache initialization
var init_cache = function(cache_expiration_interval) {
	var db = Titanium.Database.open('cache');
	db.execute('CREATE TABLE IF NOT EXISTS cache (key TEXT UNIQUE, value TEXT, expiration INTEGER)');
	db.close();
	Ti.API.info('[CACHE] INITIALIZED');

	if (!CONFIG || (CONFIG && !CONFIG.EXPIRE_ON_GET)) {
		// set cache expiration task
		setInterval(expire_cache, cache_expiration_interval * 1000);
		Ti.API.info('[CACHE] Will expire objects each ' + cache_expiration_interval + ' seconds');
	}
};

var expire_cache = function() {
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

	Ti.API.debug('[CACHE] EXPIRATION: [' + count + '] object(s) expired');
};

var current_timestamp = function() {
	var value = Math.floor(new Date().getTime() / 1000);
	Ti.API.debug("[CACHE] current_timestamp=" + value);
	return value;
};

var Cache = {
	get : function(key) {
		var db = Titanium.Database.open('cache');

		if (CONFIG && CONFIG.EXPIRE_ON_GET) {
			Ti.API.debug('[CACHE] EXPIRE_ON_GET is set to "true"');
			expire_cache();
		}

		var rs = db.execute('SELECT value FROM cache WHERE key = ?', key);
		var result = null;
		if (rs.isValidRow()) {
			Ti.API.info('[CACHE] HIT, key[' + key + ']');
			result = JSON.parse(rs.fieldByName('value'));
		} else {
			Ti.API.info('[CACHE] MISS, key[' + key + ']');
		}
		rs.close();
		db.close();

		return result;
	},

	put : function(key, value, expiration_seconds) {
		if (!expiration_seconds) {
			expiration_seconds = 300;
		}
		var expires_in = current_timestamp() + expiration_seconds;
		var db = Titanium.Database.open('cache');
		Ti.API.info('[CACHE] PUT: time=' + current_timestamp() + ', expires_in=' + expires_in);
		var query = 'INSERT OR REPLACE INTO cache (key, value, expiration) VALUES (?, ?, ?);';
		db.execute(query, key, JSON.stringify(value), expires_in);
		db.close();
	},

	del : function(key) {
		var db = Titanium.Database.open('cache');
		db.execute('DELETE FROM cache WHERE key = ?', key);
		db.close();
		Ti.API.info('[CACHE] DELETED key[' + key + ']');
	}
};

// if development environment, disable cache capabilities
if (CONFIG && CONFIG.DISABLE) {
	module.exports = {
		get: function(){},
		put: function(){},
		del: function(){}
	};
} else {
	// initialize everything
	var cache_expiration_interval = 30;
	if (CONFIG && CONFIG.CACHE_EXPIRATION_INTERVAL) {
		cache_expiration_interval = CONFIG.CACHE_EXPIRATION_INTERVAL;
	}

	init_cache(cache_expiration_interval);

	module.exports = Cache;
}