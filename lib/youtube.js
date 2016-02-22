var https = require('https')
var querystring = require('querystring')

module.exports = function (endpoint, params, callback) {
  params.key = Homey.env.YOUTUBE_KEY
  https.get({
    protocol: 'https:',
    host: 'www.googleapis.com',
    path: '/youtube/v3/' + endpoint + '?' + querystring.stringify(params),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }, function (res) {
    if (res.statusCode !== 200) {
      callback(new Error('Invalid response code' + res.statusCode))
      return
    }
    var response = ''
    res.setEncoding('utf8')
    res.on('data', function (chunk) {
      response += chunk
    })
    res.on('end', function () {
      var result
      try {
        result = JSON.parse(response)
      } catch (err) {
        callback(err)
        return
      }
      callback(null, result)
    })
  }).on('error', function (err) {
    callback(err)
  })
}
