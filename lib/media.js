var util = require('./util')
var search = require('./search')
var youtube = require('./youtube')
var youtubemp3 = require('./youtube-mp3')

var lastQuery
var lastResults

exports.init = function () {
  Homey.manager('media').on('search', function (parsedQuery, callback) {
    // Homey.log('parsedQuery', parsedQuery)
    if (!parsedQuery.searchQuery) {
      callback([])
      return
    }

    if (lastResults && lastQuery === parsedQuery.searchQuery) {
      callback(lastResults)
      return
    }

    search.searchQuery(parsedQuery.searchQuery, function (err, result) {
      if (err) {
        Homey.error(err)
        return
      }

      // Homey.log('media search result', result.items[0])
      lastQuery = parsedQuery.searchQuery
      lastResults = result.items.map(function (item) {
        return exports.parseTrack(item)
      })
      callback(null, lastResults)
    })
  })

  Homey.manager('media').on('play', exports.playVideoId)
}

exports.getVideo = function (videoId, callback) {
  if (!videoId) {
    callback(new Error('missing videoId'))
    return
  }
  youtube('videos', {
    part: 'id,snippet,contentDetails',
    id: videoId
  }, callback)
}

exports.play = function (query, callback) {
  search.searchQuery(query, function (err, result) {
    if (err) {
      callback(err)
      return
    }
    var item = result.items[0]
    // Homey.log('media play item', item)
    if (item) {
      exports.setTrack(item, callback)
    } else {
      callback(null, false)
    }
  })
}

exports.playVideoId = function (track, callback) {
  exports.getVideo(track.trackId, function (err, result) {
    if (err) {
      callback(err)
      return
    }
    var item = result.items[0]
    // Homey.log('media play item', item)
    if (item) {
      exports.setTrack(item, callback)
    } else {
      callback(null, false)
    }
  })
}

exports.setTrack = function (item, callback) {
  var id = item.id.videoId || item.id
  youtubemp3.getDownloadUrl(id, function (err, url) {
    if (err) {
      callback(err)
      return
    }

    var duration
    if (item.contentDetails && item.contentDetails.duration) {
      // duration in miliseconds
      duration = util.parsePeriod(item.contentDetails.duration) * 1000
      // if we have a negative or 0 duration omit it
      if (duration < 1) {
        duration = undefined
      }
    }
    var track = exports.parseTrack(item)
    track.stream_url = url
    track.duration = duration
    callback(null, track)
  })
}

exports.parseTrack = function (searchResult) {
  var videoId = searchResult.id.videoId || searchResult.id
  var track = {
    type: 'track',
    id: videoId,
    title: searchResult.snippet.title,
    //album: item.snippet.description,
    artist: [
      {
        name: searchResult.snippet.channelTitle,
        type: 'artist'
      }
    ],
    artwork: {
      small: searchResult.snippet.thumbnails.default.url,
      medium: searchResult.snippet.thumbnails.medium.url,
      large: searchResult.snippet.thumbnails.high.url
    },
    confidence: 0.5,
    codecs: ['homey:codec:mp3']
  }

  return track
}
