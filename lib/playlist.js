var url = require('url')
var util = require('./util')
var media = require('./media')
var youtube = require('./youtube')
var triggerYoutubeMediaChanged = util.triggerYoutubeMediaChanged

var cachedPlaylist

exports.init = function () {
  Homey.manager('flow').on('action.getYoutubePlaylistURL', onFlowActionPlayListItems)
  Homey.manager('flow').on('action.stopYoutubePlaylist', onFlowActionStopPlayList)
}

function onFlowActionPlayListItems (callback, args) {
  // Homey.log('playlist items', args)

  var playlistId = args.url
  if (playlistId.indexOf('http') === 0) {
    playlistId = url.parse(playlistId, true).query.list
  }

  if (!playlistId) {
    callback(new Error('Invalid playback URL' + args.url))
    return
  }

  if (cachedPlaylist && cachedPlaylist.items && cachedPlaylist.playlistId === playlistId) {
    selectNextInPlaylist(cachedPlaylist, args.mode, callback)
  } else {
    youtube('playlistItems', {
      part: 'contentDetails',
      maxResults: 50,
      playlistId: playlistId
    }, function (err, result) {
      if (err) {
        Homey.error(err)
        callback(err)
        return
      }

      if (result) {
        clearNextPlayTimeout(cachedPlaylist)
        result.playlistId = playlistId
        cachedPlaylist = result
        // Homey.log('playlist', cachedPlaylist)
        selectNextInPlaylist(cachedPlaylist, args.mode, callback)
      } else {
        Homey.error(new Error('no playlist items'))
        callback(new Error('no playlist items'))
      }
    })
  }
}

function onFlowActionStopPlayList (callback, args) {
  callback(null, clearNextPlayTimeout(cachedPlaylist))
}

function selectNextInPlaylist (playlist, mode, callback) {
  var nextIndex = 0
  switch (mode) {
    case 'next': // next in order
      if ('currentIndex' in playlist) {
        nextIndex = (++playlist.currentIndex) % playlist.items.length
      }
      playlist.currentIndex = nextIndex
      break
    case 'shuffle': // shuffle all
      nextIndex = Math.floor(Math.random() * playlist.items.length)
  }
  var item = playlist.items[nextIndex]
  // Homey.log('nextIndex %s', nextIndex)
  triggerYoutubeMediaChanged(item, callback)
  media.getVideo(item.contentDetails.videoId, function (err, response) {
    if (err) return Homey.error(err)
    var item = response.items[0]
    if (item.contentDetails && item.contentDetails.duration) {
      var duration = util.parsePeriod(item.contentDetails.duration)
      if (duration > 0) {
        clearNextPlayTimeout(playlist)
        // autoplay next item
        var playlistDelay = parseFloat(Homey.manager('settings').get('playlistDelay'))
        if (isNaN(playlistDelay)) {
          playlistDelay = 0
        }
        playlist.nextTimeout = setTimeout(function () {
          selectNextInPlaylist(playlist, mode, function () {})
          playlist.nextTimeout = null
        }, (duration + playlistDelay) * 1000) // in milis
      }
    }
  })
}

function clearNextPlayTimeout (playlist) {
  var playlistTimeout = playlist && playlist.nextTimeout
  if (playlistTimeout) {
    clearTimeout(playlistTimeout)
    playlist.nextTimeout = null
  }
  return !!playlistTimeout
}

exports.onFlowActionPlayListItems = onFlowActionPlayListItems
