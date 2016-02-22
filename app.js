'use strict'

var onFlowActionSearch = require('./lib/search').onFlowActionSearch
var onFlowActionSearchLive = require('./lib/search').onFlowActionSearchLive
var onFlowActionPlayListItems = require('./lib/playlist').onFlowActionPlayListItems
var onFlowActionSearchAutocomplete = require('./lib/search').onFlowActionSearchAutocomplete

exports.init = function () {
  // Homey.log('Youtube')

  Homey.manager('flow').on('action.searchYoutube', onFlowActionSearch)
  Homey.manager('flow').on('action.searchYoutubeLive', onFlowActionSearchLive)
  Homey.manager('flow').on('action.getYoutubePlaylistURL', onFlowActionPlayListItems)
  Homey.manager('flow').on('action.searchYoutube.source.autocomplete', onFlowActionSearchAutocomplete)
}
