var util = require('./util')
var search = require('./search')
var youtube = require('./youtube')
var youtubemp3 = require('./youtube-mp3')
var oauth = require('./oauth')
var http = require('http.min')

var lastQuery
var lastResults

var MAX_VIDEO_DURATION = 120 * 60 * 1000 // Filter results that are longer than 2H because the MP3 API does not support this
var MAX_PLAYLISTS = 20
var MAX_PLAYLISTS_ITEMS = 50 // Number of playlists item to fetch, must be between 0-50. TODO: Implement paging to fetch > 50 playlist items
var pollingInterval

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

      lastQuery = parsedQuery.searchQuery
      // Build a list with video ids to get the durations for the videos in 1 API call
      var idList = result.items.map(function (item) {
        return item.id.videoId
      }).join(',')

      youtube('videos', {
        part: 'id,snippet,contentDetails',
        id: idList
      }, function (err, result) {
        if (err) {
          callback(err)
        } else {
          var lastResults = result.items.map(function (item) {
            return exports.parseTrack(item)
          })
          callback(null, lastResults.filter(function (item) { return item.duration < MAX_VIDEO_DURATION })) // Filter results that are longer than 2H because the MP3 API does not support this
        }
      })
    })
  })

  Homey.manager('media').on('play', exports.playVideoId)

  // Sync playlists from youtube if the user has logged in
  Homey.manager('media').on('getPlaylists', (data, callback) => {
    console.log('Getting playlists')
    oauth.getAccessToken(function (err, accessToken) {
      if (err) {
        callback(err)
        return
      }
      // Call the api for playlists
      http.json({
        protocol: 'https:',
        host: 'www.googleapis.com',
        path: '/youtube/v3/playlists?part=id,snippet&mine=true&maxResults=' + MAX_PLAYLISTS + '&access_token=' + accessToken
      }).then(function (response) {
        if (response && response.items) {
          var playlistRequests = response.items.map((item) => {
            return new Promise((resolve, reject) => {
              getPlaylistItems(item.id, function (err, playlistItems) {
                if (err) {
                  reject(err)
                }
                resolve({
                  type: 'playlist',
                  id: item.id,
                  title: item.snippet.title,
                  tracks: playlistItems
                })
              })
            })
          })
          // Wait for all playlists to be fetched and return to Homey
          Promise.all(playlistRequests).then((playlists) => {
            callback(null, playlists)
          }).catch(function (err) {
            callback(err, [])
          })
        }
      }).catch(function (err) {
        console.log(err)
        callback(err)
      })
    })
  })

  // Get details of a single playlist when Homey asks for it
  Homey.manager('media').on('getPlaylist', (request, callback) => {
    console.log('Get Playlist')
    callback(null, getPlaylistItems(request.playlistId))
  })

  // sends a request to the Homey Media component to refresh static playlists
  Homey.manager('media').requestPlaylistsUpdate()
  startPollingForUpdates()
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
  youtubemp3.getDownloadUrl(id, function (err, result) {
    if (err) {
      callback(err)
      return
    }
    var track = exports.parseTrack(item)
    track.stream_url = result.link
    callback(null, track)
  })
}

exports.parseTrack = function (searchResult) {
  var videoId = searchResult.id.videoId || searchResult.id
  var duration
  if (searchResult.contentDetails && searchResult.contentDetails.duration) {
    // duration in miliseconds
    duration = util.parsePeriod(searchResult.contentDetails.duration) * 1000
    // if we have a negative or 0 duration omit it
    if (duration < 1) {
      duration = undefined
    }
  }
  var track = {
    type: 'track',
    id: videoId,
    title: searchResult.snippet.title,
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
    codecs: ['homey:codec:mp3'],
    duration: duration
  }

  return track
}

function getPlaylistItems (playlistId, callback) {
  oauth.getAccessToken(function (err, accessToken) {
    if (err) {
      callback(err)
      return
    }
    // Call the api for playlists
    http.json({
      protocol: 'https:',
      host: 'www.googleapis.com',
      path: '/youtube/v3/playlistItems?part=id,snippet&playlistId=' + playlistId + '&mine=true&maxResults=' + MAX_PLAYLISTS_ITEMS + '&access_token=' + accessToken
    }).then(function (response) {
      // Create a string of all youtube Ids in the playlist
      // Build a list with video ids to get the durations for the videos in 1 API call
      var playlistIdList = response.items.map(function (item) {
        return item.snippet.resourceId.videoId
      }).join(',')

      // Get details for all the tracks in a playlist
      youtube('videos', {
        part: 'id,snippet,contentDetails',
        id: playlistIdList
      }, function (err, result) {
        if (err) {
          callback(err)
        } else {
          var playlistItems = result.items.map(exports.parseTrack)
          callback(null, playlistItems.filter(function (item) { return item.duration < MAX_VIDEO_DURATION })) // Filter results that are longer than 2H because the MP3 API does not support this
        }
      })
    }).catch(function (err) {
      console.log(err)
      callback(err)
    })
  })
}

function startPollingForUpdates () {
  console.log('Polling for playlists..')
  pollingInterval = setInterval(() => {
    // Check if the user has logged in
    oauth.getAccessToken(function (err, accessToken) {
      if (err) {
        Homey.error(err)
      } else {
        Homey.manager('media').requestPlaylistsUpdate()
      }
    })
  }, 120000)
}
