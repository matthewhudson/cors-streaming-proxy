const open = require('open')
const server = require('./modules/server')

const isProd = process.env.NODE_ENV === 'production'

const port = process.env.PORT || 8080
const protocol = server.secure ? 'https' : 'http'
const host = `${protocol}://${server.name}:${port}`

server.listen(port, async () => {
  console.log(`Server listening at ${host}`)

  if (!isProd) {
    await open(host, { app: ['google chrome'] })
  }
})
