var url = require('url')
var http = require('http')
var https = require('https')

var HTTP = {}
var METHODS = ['get', 'post', 'patch', 'put', 'delete']

METHODS.forEach(function (method) {
  // https://nodejs.org/api/http.html#http_http_request_options_callback
  HTTP[method] = function (options, data) {
    return new Promise(function (resolve, reject) {
      if (data) {
        var isObject = typeof data === 'object'
        var headers = options.headers || (options.headers = {})
        if (!headers['Content-Type']) {
          headers['Content-Type'] = isObject ? 'application/json' : 'application/x-www-form-urlencoded'
        }
        if (isObject) {
          data = JSON.stringify(data)
        }
        headers['Content-Length'] = data.length
      }
      if (typeof options === 'string') {
        options = url.parse(options)
      }
      options.method = method
      var module = options.protocol.replace(':', '') === 'https' ? https : http
      var req = module.request(options, function (response) {
        var data = ''
        response.setEncoding('utf8')
        response.on('data', function (chunk) {
          data += chunk
        })
        response.on('end', function () {
          resolve({
            data: data,
            response: response
          })
        })
      }).on('error', function (err) {
        reject(err)
      })
      if (data) {
        req.write(data)
      }
      req.end()
    })
  }
})

HTTP.json = function (options) {
  return this.get(options).then(function (result) {
    try {
      return JSON.parse(result.data)
    } catch (e) {
      return Promise.reject(e)
    }
  })
}

module.exports = HTTP
