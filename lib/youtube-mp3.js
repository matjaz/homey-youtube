var http = require('http.min')

exports.getDownloadUrl = function getDownloadUrl (id, callback) {
  if (!id) {
    callback(new Error('Missing video id'))
    return
  }
  var mp3Url = 'www.youtubeinmp3.com'
  var videoUrl = 'http://www.youtube.com/watch?v=' + id
  var path = '/fetch/?format=JSON&video=' + escape(videoUrl)

  http.json({
    protocol: 'http:',
    host: mp3Url,
    path: path
  }).then(function (response) {
    if (!response.link) {
      callback(new Error('Failed to get an MP3-stream. This is most likely because the video is longer than 120 minutes'))
    }
    callback(null, response.link, response.length)
  }).catch(callback)
}
