var http = require('http.min')
var oauth = require('./oauth')

module.exports = function (endpoint, params, callback) {
  oauth.getAccessToken(function (err, accessToken) {
    if (err) {
      callback(err)
      return
    }
    var opts = {
      protocol: 'https:',
      host: 'www.googleapis.com',
      path: '/youtube/v3/' + endpoint,
      query: params,
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    }
    http.json(opts).then(function (response) {
      callback(null, response)
    }).catch(callback)
  })
}
