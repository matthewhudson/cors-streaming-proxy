const restify = require('restify')
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
server.opts('/', proxy.opts)
server.get(/^\/(https?:\/\/.+)/, proxy.get)
server.post(/^\/(https?:\/\/.+)/, proxy.post)

module.exports = server
