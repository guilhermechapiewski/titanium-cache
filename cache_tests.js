(function(){

	var cache = require('cache');

	describe('cache', function() {

		it('should cache objects', function() {
			cache.del('my_fake_key');
			expect(cache.get('my_fake_key')).toBeNull();

			var obj = { my: 'obj' };
			cache.put('my_fake_key', obj);

			cached_obj = cache.get('my_fake_key');
			expect(cached_obj).not.toBeNull();
			expect(cached_obj).toEqual(obj);
		});

		it('should delete items from cache', function() {
			cache.del('deleted_key');
			expect(cache.get('deleted_key')).toBeNull();

			cache.put('deleted_key', { deleted: 'obj' });
			expect(cache.get('deleted_key')).not.toBeNull();

			cache.del('deleted_key');
			expect(cache.get('deleted_key')).toBeNull();
		});

		it('should get javascript objects from cache', function() {
			cache.del('my_cache_key');
			expect(cache.get('my_cache_key')).toBeNull();

			var obj = { prop: 'value', other_prop: 'other value' };
			cache.put('my_cache_key', obj);

			cached_obj = cache.get('my_cache_key');
			expect(cached_obj).not.toBeNull();
			expect(cached_obj).toEqual(obj);
			expect(cached_obj.prop).toEqual(obj.prop);
			expect(cached_obj.other_prop).toEqual(obj.other_prop);
		});

		it('should get string objects from cache', function() {
			cache.del('my_cache_key');
			expect(cache.get('my_cache_key')).toBeNull();

			var obj = '<my_xml>hello world</my_xml>';
			cache.put('my_cache_key', obj);

			cached_obj = cache.get('my_cache_key');
			expect(cached_obj).not.toBeNull();
			expect(cached_obj).toEqual(obj);
		});

	});

})();
