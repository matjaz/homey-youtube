var http = require('http')

exports.init = function () {

  http.createServer(function (req, res) {
    if (req.url.slice(0, 11) != '/yt-stream/') {
      res.writeHead(200, {
        'Content-Type': 'application/json'
      })
      res.end(JSON.stringify({status: 'ok'}))
      return
    }

    var id = req.url.slice(11, 25)
    var url = 'https://www.youtube.com/watch?v=' + id

    http.request({
      hostname: 'www.youtubetransfer.com',
      path: '/getinfo/?url=' + encodeURIComponent(url)
    }, function(r) {
      var cookies = r.headers['set-cookie']
      if (!cookies) {
        res.writeHead(500, {
          'Content-Type': 'application/json'
        })
        res.end(JSON.stringify({error: 'Error fetching cookies'}))
        return
      }
      cookies = cookies.map(function (cookie) {
        return cookie.split(';')[0]
      })

      var options = {
        agent: false,
        hostname: 'www.youtubetransfer.com',
        path: '/download/?url=' + (new Buffer(url).toString('base64')),
        headers: {
          cookie: cookies.join('; ')
        }
      }

      var proxyReq = http.request(options, function(originResponse) {
        res.writeHead(originResponse.statusCode, originResponse.headers)
        originResponse.pipe(res)
      }).on('error', function (err) {
        console.error(err)
      })
      .end()
    })
    .on('error', function (err) {
      console.error(err)
    })
    .end()
  }).listen(40507, '127.0.0.1')
}
