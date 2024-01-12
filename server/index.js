import express from 'express'
import { createServer } from 'node:http'
import path from 'path'
import { Server } from 'socket.io'

import { router } from './route.js'

const app = express()
const server = createServer(app)
app.use(express.static('./'))
app.use(express.json())
const io = new Server(server)

const PORT = process.env.port || 3000

const HTMLPath = path.join(path.resolve() + path.resolve('/index.html'))

app.get('/', (req, res) => {
  res.sendFile(HTMLPath)
})

app.use('/', router)

io.on('connection', socket => {
  socket.on('login', user => {
    socket.join(user)

    console.log(`user #${user} connected on socket ${socket.id}`)
  })

  socket.on('chat message', (msg, receiver, chat) => {
    const receiverId = Number(receiver)
    io.to(receiverId).to(socket.id).emit('chat message', msg, chat)
  })

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
})

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})
