var http = require('http.min')

module.exports.authorize = function (callback) {
  callback = callback || function () { }

  Homey.manager('cloud').generateOAuth2Callback(
    'https://accounts.google.com/o/oauth2/auth?client_id=' + Homey.env.CLIENT_ID + '&scope=https://www.googleapis.com/auth/youtube.readonly&approval_prompt=force&access_type=offline&response_type=code&redirect_uri=https://callback.athom.com/oauth2/callback/',
    onGotUrl,
    onGotCode
  )

  function onGotUrl (err, url) {
    if (err) return callback(err)
    // Call client with the URL
    callback(null, url)
  }

  function onGotCode (err, code) {
    if (err) {
      Homey.manager('api').realtime('authorized', false)
      return Homey.error(err)
    }

    // Build request parameters
    var form = {
      'client_id': Homey.env.CLIENT_ID,
      'client_secret': Homey.env.CLIENT_SECRET,
      'code': code,
      'grant_type': 'authorization_code',
      'redirect_uri': 'https://callback.athom.com/oauth2/callback/'
    }

    var options = {
      uri: 'https://accounts.google.com/o/oauth2/token',
      form: form,
      json: true
    }

    // Swap the code for an access token
    http.post(options).then(function (result) {
      // Get the user information to store in settings
      http.json({
        protocol: 'https:',
        host: 'www.googleapis.com',
        path: '/youtube/v3/channels?part=id,snippet&mine=true&access_token=' + result.data.access_token
      }).then(function (response) {
        // Keep track of when the token expires
        var expiresAt = new Date()
        expiresAt.setSeconds(expiresAt.getSeconds() + result.data.expires_in)
        // Store access token in settings
        Homey.manager('settings').set('auth', {
          accessToken: result.data.access_token,
          refreshToken: result.data.refresh_token,
          expiresAt: expiresAt,
          userName: response.items[0].snippet.title,
          userProfilePicture: response.items[0].snippet.thumbnails.default.url
        })
        // Tell the client to refresh login information
        Homey.manager('api').realtime('authorized', true)
        // Tell Homey to refresh the playlists
        Homey.manager('media').requestPlaylistsUpdate()
      }).catch(function (err) {
        Homey.manager('api').realtime('authorized', false)
        return Homey.error(err)
      })
    }).catch(function (err) {
      console.log(err)
      Homey.manager('api').realtime('authorized', false)
      return Homey.error(err)
    })
  }
}

module.exports.getAccessToken = function (callback) {
  var auth = Homey.manager('settings').get('auth')
  if (!auth || !auth.accessToken || auth.accessToken === '') {
    callback(new Error('Could not find an access token for the current user'))
  }
  // Check if the access token has expired
  if (new Date().getTime() > new Date(auth.expiresAt).getTime()) {
    // Refresh the user's access token
    console.log('Access token expired, getting a new one')
    refreshAccessToken(auth.refreshToken, function (err) {
      if (err) {
        callback(err)
      } else {
        // Return access token
        callback(null, Homey.manager('settings').get('auth').accessToken)
      }
    })
  } else {
    callback(null, auth.accessToken)
  }
}

function refreshAccessToken (refreshToken, callback) {
  // Build request parameters
  var form = {
    'client_id': Homey.env.CLIENT_ID,
    'client_secret': Homey.env.CLIENT_SECRET,
    'refresh_token': refreshToken,
    'grant_type': 'refresh_token'
  }

  var options = {
    uri: 'https://accounts.google.com/o/oauth2/token',
    form: form,
    json: true
  }

  // Get a new access token
  http.post(options).then(function (result) {
    // Keep track of when the token expires
    var expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + result.data.expires_in)
    var auth = Homey.manager('settings').get('auth')
    // Set the new access token and expiration date
    auth.accessToken = result.data.access_token
    auth.expiresAt = expiresAt
    // Store access token in settings
    Homey.manager('settings').set('auth', auth)
    callback(null, true)
  }).catch(function (err) {
    console.log(err)
    callback(err)
  })
}
