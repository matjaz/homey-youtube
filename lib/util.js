
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
