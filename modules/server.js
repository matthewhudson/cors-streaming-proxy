const restify = require('restify')
const toobusy = require('toobusy-js')
const fs = require('fs')
const proxy = require('./proxy')

const isProd = process.env.NODE_ENV === 'production'
const serverOptions = isProd
  ? {}
  : {
      name: 'local.hudson.dev',
      key: fs.readFileSync('./local.hudson.dev+3-key.pem'),
      cert: fs.readFileSync('./local.hudson.dev+3.pem')
    }

const server = restify.createServer(serverOptions)

server.use(restify.queryParser({ mapParams: false }))

server.use((req, res, next) => {
  if (toobusy()) {
    res.send(503, 'Server is overloaded! Please try again later.')
  } else {
    next()
  }
})

const freeTier = restify.throttle({
  rate: 3,
  burst: 10,
  xff: true,
  overrides: {
    '192.168.1.1': {
      rate: 0, // unlimited
      burst: 0
    }
  }
})

// CORS configuration

server.opts('/', proxy.opts)

// Request handler configuration (for free tier)
server.get(/^\/(https?:\/\/.+)/, freeTier, proxy.get)
server.post(/^\/(https?:\/\/.+)/, freeTier, proxy.post)

module.exports = server
