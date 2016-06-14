var url = require('url')
var util = require('./util')
var media = require('./media')
var youtube = require('./youtube')
var app2app = require('./app2app')
var triggerYoutubeMediaChanged = util.triggerYoutubeMediaChanged

var autoplay
var cachedPlaylist
var chromecastStatusRegistered

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

  autoplay = true
  if (!chromecastStatusRegistered) {
    app2app.getChromecastApp().then(chromecastApp => {
      if (chromecastApp) {
        chromecastStatusRegistered = true
        chromecastApp.on('status', (data) => {
          if (autoplay && cachedPlaylist && data && data.status === 'IDLE') {
            selectNextInPlaylist(cachedPlaylist, () => {})
          }
        })
      }
    })
  }

  if (cachedPlaylist && cachedPlaylist.items && cachedPlaylist.playlistId === playlistId) {
    selectNextInPlaylist(cachedPlaylist, callback)
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
        result.playlistId = playlistId
        result.playMode = args.mode
        cachedPlaylist = result
        // Homey.log('playlist', cachedPlaylist)
        selectNextInPlaylist(cachedPlaylist, callback)
      } else {
        Homey.error(new Error('no playlist items'))
        callback(new Error('no playlist items'))
      }
    })
  }
}

function onFlowActionStopPlayList (callback, args) {
  autoplay = false
  callback(null, true)
}

function selectNextInPlaylist (playlist, callback) {
  var nextIndex = 0
  switch (playlist.playMode) {
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
}
