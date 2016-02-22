var url = require('url')
var youtube = require('./youtube')
var triggerYoutubeMediaChanged = require('./util').triggerYoutubeMediaChanged

var cachedPlaylist

exports.onFlowActionPlayListItems = function onFlowActionPlayListItems (callback, args) {
  // Homey.log('playlist items', args)

  var playlistId = args.url
  if (playlistId.indexOf('http') === 0) {
    playlistId = url.parse(playlistId, true).query.list
  }

  if (!playlistId) {
    callback(new Error('Invalid playback URL' + args.url))
    return
  }

  if (cachedPlaylist && cachedPlaylist.playlistId === playlistId) {
    selectNextInPlaylist(cachedPlaylist, args.mode, callback)
  } else {
    youtube('playlistItems', {
      part: 'contentDetails',
      maxResults: 50,
      playlistId: playlistId
    }, function (err, result) {
      if (err) return Homey.error(err)

      result.playlistId = playlistId
      cachedPlaylist = result
      // Homey.log('playlist', cachedPlaylist)
      selectNextInPlaylist(cachedPlaylist, args.mode, callback)
    })
  }
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
  // Homey.log('nextIndex %s', nextIndex)
  triggerYoutubeMediaChanged(playlist.items[nextIndex], callback)
}
