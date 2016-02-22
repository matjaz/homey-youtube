var youtube = require('./youtube')
var triggerYoutubeMediaChanged = require('./util').triggerYoutubeMediaChanged

exports.onFlowActionSearch = function onFlowActionSearch (callback, args) {
  // Homey.log('search', args)

  triggerYoutubeMediaChanged({
    id: {
      videoId: args.source.id
    }
  }, callback)
}

exports.onFlowActionSearchAutocomplete = function onFlowActionSearchAutocomplete (callback, value) {
  // Homey.log('search autocomplete', value)

  youtube('search', {
    part: 'id,snippet',
    q: value.query,
    type: 'video',
    maxResults: 10
  }, function (err, result) {
    if (err) return Homey.error(err)

    // Homey.log('search autocomplete result', result.items[0])
    callback(null, result.items.map(function(item) {
      return {
        id: item.id.videoId,
        icon: item.snippet.thumbnails.default.url,
        name: item.snippet.title,
        description: item.snippet.description
      }
    }))
  })
}

exports.onFlowActionSearchLive = function onFlowActionSearchLive (callback, args) {
  // Homey.log('search URL', args)

  youtube('search', {
    part: 'id',
    q: args.query,
    type: 'video',
    maxResults: 10
  }, function (err, result) {
    if (err) return Homey.error(err)

    // Homey.log('search', result, result.items[0])
    triggerYoutubeMediaChanged(result.items[0], callback)
  })
}
