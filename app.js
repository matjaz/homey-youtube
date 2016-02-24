'use strict'

var media = require('./lib/media')
var search = require('./lib/search')
var playlist = require('./lib/playlist')

exports.init = function () {
  media.init()

  search.init()
  playlist.init()

  Homey.log('YouTube ready')
}
