'use strict'

var search = require('./lib/search')
var playlist = require('./lib/playlist')

exports.init = function () {

  search.init()
  playlist.init()

  Homey.log('Youtube ready')
}
