'use strict'

var media = require('./lib/media')
var speech = require('./lib/speech-input')
var search = require('./lib/search')
var playlist = require('./lib/playlist')

exports.init = function () {
  media.init()
  speech.init()

  search.init()
  playlist.init()

  Homey.log('YouTube ready')
}
