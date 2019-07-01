const request = require('request')

let clientHeadersBlacklist = new Set(['host', 'cookie'])
let serverHeadersBlacklist = new Set(['set-cookie', 'connection'])
let requiredHeaders = [
  'x-access-key'
]

// 2GB = 2147483648
const sizeLimit = 2147483648

/*
get handler handles standard GET reqs as well as streams
*/
const proxy = method => (req, res, next) => {
  // Actually do the CORS thing! :)
  res.header('Access-Control-Allow-Origin', '*')

  let url
  switch (method) {
    case 'GET':
      url = req.url.substr(1)
      break
    case 'POST':
      url = req.params[0]
      break
  }

  /*
  // require `X-Access-Key` header
  if (!requiredHeaders.some(header => req.headers[header])) {
    res.statusCode = 403
    return res.end(`[${res.statusCode}] Proxy server is missing a required header.`)
  }

  // @ TODO: FIX
  req.headers['x-access-key'] = process.env.PROXY_ACCESS_KEY
  // Check `x-access-key`
  if (req.headers['x-access-key'] !== process.env.PROXY_ACCESS_KEY) {
    res.statusCode = 401
    return res.end(`[${res.statusCode}] Proxy server faiiled validate header 'x-access-key.`)
  }
  */

  // TODO redirect same origin
  /* from cors-anywhere: boolean redirectSameOrigin - If true, requests to
   * URLs from the same origin will not be proxied but redirected. The
   * primary purpose for this option is to save server resources by
   * delegating the request to the client (since same-origin requests should
   * always succeed, even without proxying). */

  // forward client headers to server
  const headers = {}
  for (var header in req.headers) {
    if (!clientHeadersBlacklist.has(header.toLowerCase())) {
      headers[header] = req.headers[header]
    }
  }
  const forwardedFor = req.headers['X-Fowarded-For']
  headers['X-Fowarded-For'] =
    (forwardedFor ? forwardedFor + ',' : '') + req.connection.remoteAddress

  let data = 0 // This variable contains the size of the data (for limiting file size)
  request(url, { method, headers }) // request the document that the user specified
    .on('response', page => {
      // Check content length - if it's larger than the size limit, end the request with a 413 error.
      if (Number(page.headers['content-length']) > sizeLimit) {
        res.statusCode = 413
        res.end(`[413]: Maximum allowed size is ${sizeLimit} bytes.`)
      }
      res.statusCode = page.statusCode

      // include only desired headers
      for (let header in page.headers) {
        if (!serverHeadersBlacklist.has(header)) {
          console.log(header, page.headers[header])
          res.header(header, page.headers[header])
        }
      }
      // must flush here -- otherwise pipe() will include the headers anyway!
      res.flushHeaders()
    })
    .on('data', chunk => {
      data += chunk.length
      if (data > sizeLimit) {
        res.abort() // kills response and request cleanly
      }
    })
    .on('end', () => {
      res.end() // End the response when the stream ends
    })
    .pipe(res) // Stream requested url to response

  next()
}

/*
opts handler allows us to use our own CORS preflight settings
*/
const opts = (req, res, next) => {
  // Couple of lines taken from http://stackoverflow.com/questions/14338683
  res.header('Access-Control-Allow-Origin', '*')
  // Only allow GET for now
  res.header('Access-Control-Allow-Methods', 'GET')
  res.header(
    'Access-Control-Allow-Headers',
    req.header('Access-Control-Request-Headers')
  )
  // Cache preflight for 24 hrs if supported
  res.header('Access-Control-Max-Age', '86400')

  res.send(200)

  next()
}

const get = proxy('GET')
const post = proxy('POST')

module.exports = { get, post, opts }
