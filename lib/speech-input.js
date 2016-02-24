var media = require('./media')
var search = require('./search')

exports.init = function () {
  // Homey.log('listen to speech')

  Homey.manager('speech-input').on('speech', function (speech) {
    // Homey.log(speech)

    speech.triggers.some(function (trigger) {
      var query = speech.transcript.slice(trigger.position + trigger.text.length).trim()
      if (query.length < 3) {
        return
      }
      // Homey.log(trigger, query)
      switch (trigger.id) {
        case 'youtube':
        case 'watch':
          search.onFlowActionSearchLive(function () {}, {
            query: query
          })
          return true // execute only one trigger
        case 'play':
        case 'playYoutube':
          media.play(query, function () {})
          return true
      }
    })
  })
}
