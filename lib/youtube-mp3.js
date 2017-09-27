
exports.getDownloadUrl = function getDownloadUrl (id, callback) {
  if (!id) {
    callback(new Error('Missing video id'))
    return
  }
  callback(null, {
    link: 'http://127.0.0.1:40507/yt-stream/' + id
  })
}
