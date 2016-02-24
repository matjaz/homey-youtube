var search = require('./lib/search').search

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
}]
