const open = require('open')
const server = require('./modules/server')

const port = process.env.PORT || 8080
const protocol = server.secure ? 'https' : 'http'
const env = process.env.NODE_ENV || 'dev'
const host = `${protocol}://${server.name}:${port}`

server.listen(port, async () => {
  console.log(`Server listening at ${host}`)

  if (env === 'dev') {
    await open(host, { app: ['google chrome'] })
  }
})
