var util = require('./util')
var media = require('./media')
var search = require('./search')

exports.init = function () {
  // Homey.log('listen to speech')

  Homey.manager('speech-input').on('speech', function (speech, callback) {
    // Homey.log(speech)

    var ytTrigger
    var isMatch = speech.triggers.some(function (trigger) {
      if (trigger.id === 'youtube') {
        ytTrigger = trigger
        return
      }
      var query = util.removeTriggerText(speech.transcript, trigger)
      if (ytTrigger) {
        query = query.replace(ytTrigger.text, '')
      }
      query = query.trim()
      // Homey.log(trigger, query)
      if (query.length < 3) {
        return
      }
      switch (trigger.id) {
        case 'watch':
          search.onFlowActionSearchLive(function () {}, {
            query: query
          })
          return true // execute only one trigger
        case 'play':
          media.play(query, function () {})
          return true
      }
    })
    callback(null, isMatch)
  })
}
