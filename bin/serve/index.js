'use strict'

const importCwd = require('import-cwd')
const path = require('path')

const listenMessage = require('./listen-message')
const getPort = require('./get-port')

module.exports = async ({ filename, filepkg, cli, restarting }) => {
  const { userPort, port, inUse } = await getPort(cli)

  const filepath = path.resolve(process.cwd(), filename)
  const module = require(filepath)

  const express = importCwd('express')
  const app = express()

  module(app, express)

  const server = app.listen(port, () => {
    if (!restarting) {
      const message = listenMessage({
        appName: filepkg.name,
        port,
        inUse,
        userPort
      })
      console.log(message)
    }
  })

  const sockets = []

  server.on('connection', socket => {
    const index = sockets.push(socket)
    socket.once('close', () => sockets.splice(index, 1))
  })

  require('../watch')({ filename, filepkg, server, cli, sockets })
}