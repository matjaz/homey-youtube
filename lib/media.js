var util = require('./util')
var search = require('./search')
var youtube = require('./youtube')
var youtubemp3 = require('./youtube-mp3')

var lastQuery
var lastResults

exports.init = function () {
  Homey.manager('media').on('search', function (parsedQuery, callback) {
    // Homey.log('parsedQuery', parsedQuery)

    if (!parsedQuery.query) {
      callback([])
      return
    }

    if (lastResults && lastQuery === parsedQuery.query) {
      callback(lastResults)
      return
    }

    search.searchQuery(parsedQuery.query, function (err, result) {
      if (err) {
        Homey.error(err)
        return
      }

      // Homey.log('media search result', result.items[0])
      lastQuery = parsedQuery.query
      lastResults = result.items.map(function (item) {
        return {
          type: 'track',
          id: item.id.videoId,
          title: item.snippet.title,
          album: item.snippet.description,
          artist: item.snippet.channelTitle,
          artwork: item.snippet.thumbnails.default.url,
          duration: item.snippet.duration,
          confidence: 0.5
        }
      })
      callback(lastResults)
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

exports.playVideoId = function (videoId, callback) {
  exports.getVideo(videoId, function (err, result) {
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
    var duration = 0
    if (item.contentDetails && item.contentDetails.duration) {
      duration = util.parsePeriod(item.contentDetails.duration)
      // return duration in milliseconds
      duration = duration * 1000
    }
    
    // if we have a negative or 0 duration omit it altogether
    if (duration < 1) {
      duration = undefined
    }
    
    Homey.manager('media').setTrack({
      id: id,
      title: item.snippet.title,
      album: item.snippet.description,
      artist: item.snippet.channelTitle,
      artwork: item.snippet.thumbnails.default.url,
      duration: duration,
      stream_url: url
    })
    callback(null, true)
  })
}
