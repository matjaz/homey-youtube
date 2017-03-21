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
    maxResults: 5
  }, callback)
}

function onFlowActionSearch (callback, args) {
  // Homey.log('search', args)

  triggerYoutubeMediaChanged({
    id: {
      videoId: args.source.id
    }
  }, 'video=' + args.source.id, callback)
}

function onFlowActionSearchAutocomplete (callback, value) {
  // Homey.log('search autocomplete', value)

  exports.searchQuery(value.query, function (err, result) {
    if (err || !result) {
      Homey.error(err)
      callback(err || new Error('Unknown error'))
      return
    }

    if (result.error || !result.items) {
      err = result.error && result.error.errors && result.error.errors[0]
      if (err) {
        err = new Error(err.message + ': ' + err.domain + ' ' + err.reason)
      }
      callback(err || new Error('Missing playlist items'))
      return
    }

    // Homey.log('search autocomplete result', result.items[0])
    callback(null, result.items.map(function (item) {
      return {
        id: item.id.videoId,
        image: item.snippet.thumbnails.default.url,
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

    var itemNumber = 0
    if (args.mode === 'random') {
      // Select a random video
      var maxRandom = result.items.length
      itemNumber = Math.floor(Math.random() * (maxRandom))
    }
    triggerYoutubeMediaChanged(result.items[itemNumber], 'search=' + args.query, callback)
    // Homey.log('search', result, result.items[0])
  })
}

exports.onFlowActionSearch = onFlowActionSearch
exports.onFlowActionSearchAutocomplete = onFlowActionSearchAutocomplete
exports.onFlowActionSearchLive = onFlowActionSearchLive
