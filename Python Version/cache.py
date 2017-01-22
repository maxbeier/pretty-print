''' From http://flask.pocoo.org/snippets/9/ '''

from flask import request
from werkzeug.contrib.cache import SimpleCache

CACHE_TIMEOUT = 0  # never expire

cache = SimpleCache()


class cached(object):

    def __init__(self, timeout=None):
        self.timeout = timeout or CACHE_TIMEOUT

    def __call__(self, f):
        def decorator(*args, **kwargs):
            response = cache.get(args)
            if response is None:
                response = f(*args, **kwargs)
                cache.set(args, response, self.timeout)
            return response
        return decorator
