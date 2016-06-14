exports.getChromecastApp = function () {
  return new Promise((resolve, reject) => {
    var api = Homey.manager('api')
    var app = new api.App('com.google.chromecast')
    app.isInstalled(function(err, installed) {
      if (err) {
        reject(err)
      } else {
        resolve(installed ? app : undefined)
      }
    })
  })
}
