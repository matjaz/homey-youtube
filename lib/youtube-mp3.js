var url = require('url')
var http = require('http.min')

// https://github.com/MaxGfeller/youtube-mp3/issues/1
var b0I = {
  V: function(I, B, P) {
    return I * B * P
  },
  D: function(I, B) {
    return I < B
  },
  E: function(I, B) {
    return I == B
  },
  B3: function(I, B) {
    return I * B
  },
  G: function(I, B) {
    return I < B
  },
  v3: function(I, B) {
    return I * B
  },
  I3: function(I, B) {
    return I in B
  },
  C: function(I, B) {
    return I % B
  },
  R3: function(I, B) {
    return I * B
  },
  O: function(I, B) {
    return I % B
  },
  Z: function(I, B) {
    return I < B
  },
  K: function(I, B) {
    return I - B
  }
}

function _sig(H) {
    var U = 'R3',
        m3 = 'round',
        e3 = 'B3',
        D3 = 'v3',
        N3 = 'I3',
        g3 = 'V',
        K3 = 'toLowerCase',
        n3 = 'substr',
        z3 = 'Z',
        d3 = 'C',
        P3 = 'O',
        x3 = ['a', 'c', 'e', 'i', 'h', 'm', 'l', 'o', 'n', 's', 't', '.'],
        G3 = [6, 7, 1, 0, 10, 3, 7, 8, 11, 4, 7, 9, 10, 8, 0, 5, 2],
        M = ['a', 'c', 'b', 'e', 'd', 'g', 'm', '-', 's', 'o', '.', 'p', '3', 'r', 'u', 't', 'v', 'y', 'n'],
        X = [
            [17, 9, 14, 15, 14, 2, 3, 7, 6, 11, 12, 10, 9, 13, 5],
            [11, 6, 4, 1, 9, 18, 16, 10, 0, 11, 11, 8, 11, 9, 15, 10, 1, 9, 6]
        ],
        A = {
            'a': 870,
            'b': 906,
            'c': 167,
            'd': 119,
            'e': 130,
            'f': 899,
            'g': 248,
            'h': 123,
            'i': 627,
            'j': 706,
            'k': 694,
            'l': 421,
            'm': 214,
            'n': 561,
            'o': 819,
            'p': 925,
            'q': 857,
            'r': 539,
            's': 898,
            't': 866,
            'u': 433,
            'v': 299,
            'w': 137,
            'x': 285,
            'y': 613,
            'z': 635,
            '_': 638,
            '&': 639,
            '-': 880,
            '/': 687,
            '=': 721
        },
        r3 = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
        gs = function(I, B) {
            var P = 'D',
                J = ''
            for(var R = 0; b0I[P](R, I.length); R++) {
                J += B[I[R]]
            }
            return J
        },
        ew = function(I, B) {
            var P = 'K',
                J = 'indexOf'
            return I[J](B, b0I[P](I.length, B.length)) !== -1
        },
        gh = function() {
            var I = gs(G3, x3)
            return eval(I)
        },
        fn = function(I, B) {
            var P = 'E',
                J = 'G'
            for(var R = 0; b0I[J](R, I.length); R++) {
                if(b0I[P](I[R], B)) return R
            }
            return -1
        },
        L = [1.23413, 1.51214, 1.9141741, 1.5123114, 1.51214, 1.2651],
        F = 1
    try {
        F = L[b0I[P3](1, 2)]
        var W = 'www.youtube-mp3.org',
            S = gs(X[0], M),
            T = gs(X[1], M)
        if(ew(W, S) || ew(W, T)) {
            F = L[1]
        } else {
            F = L[b0I[d3](5, 3)]
        }
    } catch(I) {}
    var N = 3219
    for(var Y = 0; b0I[z3](Y, H.length); Y++) {
        var Q = H[n3](Y, 1)[K3]()
        if(fn(r3, Q) > -1) {
            N = N + (b0I[g3](parseInt(Q), 121, F))
        } else {
            if(b0I[N3](Q, A)) {
                N = N + (b0I[D3](A[Q], F))
            }
        }
        N = b0I[e3](N, 0.1)
    }
    N = Math[m3](b0I[U](N, 1000))
    return N
}

function sig(a) {
  var b = 'X'
  try {
    b = _sig(a)
  } catch(c) {}
  if('X' != b) return b
}

function signUrl(url) {
  var host = 'http://www.youtube-mp3.org'
  return host + url + '&s=' + escape(sig(host + url))
}

exports.getDownloadUrl = function getDownloadUrl (id, callback) {
  if (!id) {
    callback(new Error('Missing video id'))
    return
  }
  var videoUrl = 'http://www.youtube.com/watch?v=' + id
  var path = '/a/pushItem/?item=' + escape(videoUrl) + '&el=na&bf=false&r=' + new Date().getTime()
  http.get(signUrl(path)).then(function(result) {
    var videoId = result.data
    var path = '/a/itemInfo/?video_id=' + videoId + '&ac=www&t=grp&r=' + new Date().getTime()
    http.get(signUrl(path)).then(function(result) {
      var info = result.data
      try {
        var data = JSON.parse(info.slice(7, -1))
        var url = '/get?video_id=' + videoId + '&ts_create=' + data.ts_create + '&r=' + data.r + '&h2=' + data.h2
        callback(null, signUrl(url))
      } catch (e) {
        callback(e)
      }
    }).catch(callback)
  }).catch(callback)
}
