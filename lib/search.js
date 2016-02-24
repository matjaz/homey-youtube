var youtube = require('./youtube')
var triggerYoutubeMediaChanged = require('./util').triggerYoutubeMediaChanged

exports.init = function () {
  var flow = Homey.manager('flow')
  flow.on('action.searchYoutube', onFlowActionSearch)
  flow.on('action.searchYoutubeLive', onFlowActionSearchLive)
  flow.on('action.searchYoutube.source.autocomplete', onFlowActionSearchAutocomplete)
}

exports.search = function (options, callback) {
  youtube('search', options, callback)
}

exports.searchQuery = function (query, callback) {
  exports.search({
    part: 'id,snippet',
    q: query,
    type: 'video',
    maxResults: 10
  }, callback)
}

function onFlowActionSearch (callback, args) {
  // Homey.log('search', args)

  triggerYoutubeMediaChanged({
    id: {
      videoId: args.source.id
    }
  }, callback)
}

function onFlowActionSearchAutocomplete (callback, value) {
  // Homey.log('search autocomplete', value)

  exports.searchQuery(value.query, function (err, result) {
    if (err) {
      Homey.error(err)
      callback(err)
      return
    }

    // Homey.log('search autocomplete result', result.items[0])
    callback(null, result.items.map(function (item) {
      return {
        id: item.id.videoId,
        icon: item.snippet.thumbnails.default.url,
        name: item.snippet.title,
        description: item.snippet.description
      }
    }))
  })
}

function onFlowActionSearchLive (callback, args) {
  // Homey.log('search URL', args)

  exports.searchQuery(args.query, function (err, result) {
    if (err) return Homey.error(err)

    // Homey.log('search', result, result.items[0])
    triggerYoutubeMediaChanged(result.items[0], callback)
  })
}

exports.onFlowActionSearch = onFlowActionSearch
exports.onFlowActionSearchAutocomplete = onFlowActionSearchAutocomplete
exports.onFlowActionSearchLive = onFlowActionSearchLive
