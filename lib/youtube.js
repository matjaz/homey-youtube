var http = require('./http')
var querystring = require('querystring')

module.exports = function (endpoint, params, callback) {
  params.key = Homey.env.YOUTUBE_KEY
  http.json({
    protocol: 'https:',
    host: 'www.googleapis.com',
    path: '/youtube/v3/' + endpoint + '?' + querystring.stringify(params)
  }).then(function (response) {
    callback(null, response)
  }).catch(callback)
}
