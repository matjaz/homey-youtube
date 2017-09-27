'use strict'

var media = require('./lib/media')
var speech = require('./lib/speech-input')
var search = require('./lib/search')
var playlist = require('./lib/playlist')
var server = require('./lib/media-server')

exports.init = function () {
  media.init()
  speech.init()

  search.init()
  playlist.init()

  server.init()

  Homey.log('YouTube ready')
}
