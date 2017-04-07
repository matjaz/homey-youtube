var search = require('./lib/search').search
var getInfo = require('./lib/info').getInfo
var oauth = require('./lib/oauth')

module.exports = [{
  path: '/search',
  method: 'GET',
  description: 'Search YouTube. Example: /search?part=id,snippet&q=hello%20world%20aloe&type=video&maxResults=10',
  fn: function (callback, args) {
    search(args.query, function (err, result) {
      if (err) {
        Homey.error(err)
        callback(err)
      } else {
        callback(null, result)
      }
    })
  }
}, {
  method: 'GET',
  path: '/videoInfo',
  description: 'Get YouTube video info. Example: /videoInfo?id=mFrghyAyNTg',
  fn: function (callback, args) {
    info(args.query.url, args.query, callback)
  }
}, {
  method: 'GET',
  path: '/videoInfo/:id',
  description: 'Get YouTube video info. Example: /videoInfo?id=mFrghyAyNTg',
  fn: function (callback, args) {
    info(args.params.id, args.query, callback)
  }
}, {
  description: 'Log-in',
  method: 'POST',
  path: '/settings/authorize',
  fn: function (callback) {
    oauth.authorize(callback)
  }
}
]

function info (idOrUrl, options, callback) {
  if (options['filter.type']) {
    var filterType = options['filter.type']
    options.filter = function (format) {
      return format.type && format.type.startsWith(filterType)
    }
    delete options['filter.type']
  }
  getInfo(idOrUrl, options)
    .then(result => callback(null, result))
    .catch(callback)
}
