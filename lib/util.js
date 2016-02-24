exports.triggerYoutubeMediaChanged = function triggerYoutubeMediaChanged (item, callback) {
  // Homey.log('youtubeMediaChanged', item)
  var info = item && (item.contentDetails || item.id)
  var videoId = info && info.videoId
  if (videoId) {
    Homey.manager('flow').trigger('youtubeMediaChanged', {
      url: 'https://www.youtube.com/watch?v=' + videoId
    })
  }
  callback(null, !!videoId)
}

exports.parsePeriod = function (period) {
  var seconds = 0
  if (period.slice(0, 2) === 'PT') {
    var m
    var re = /(\d+)([HMS])/g
    while ((m = re.exec(period))) {
      var factor = 1
      switch (m[2]) {
        case 'H':
          factor *= 3600
          break
        case 'M':
          factor *= 60
      }
      seconds += parseInt(m[1]) * factor
    }
  }
  return seconds
}
