'use strict'

var ytdl = require('ytdl-core')
var ytdlUtil = require('ytdl-core/lib/util')

exports.getInfo = function (idOrUrl, options) {
  if (idOrUrl.length < 15) {
    idOrUrl = `https://www.youtube.com/watch?v=${idOrUrl}`
  } else if (!isYoutubeVideo(idOrUrl)) {
    return Promise.reject(new Error('Invalid id/url'))
  }
  return getYTVideoInfo(idOrUrl, options)
}

function getYTVideoInfo (url, options) {
  return new Promise((resolve, reject) => {
    ytdl.getInfo(url, (err, info) => {
      if (err) {
        reject(err)
        return
      }
      var format = ytdlUtil.chooseFormat(info.formats, options)
      if (format instanceof Error) {
        reject(format)
      } else {
        resolve(format)
      }
    })
  })
}

function isYoutubeVideo (url) {
  return /(?:youtu\.be)|(?:youtube\.com)/.test(url)
}
