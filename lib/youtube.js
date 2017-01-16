var http = require('http.min')

module.exports = function (endpoint, params, callback) {
  params.key = Homey.manager('settings').get('apiKey') || Homey.env.YOUTUBE_KEY
  http.json({
    protocol: 'https:',
    host: 'www.googleapis.com',
    path: '/youtube/v3/' + endpoint,
    query: params
  }).then(function (response) {
    callback(null, response)
  }).catch(callback)
}
