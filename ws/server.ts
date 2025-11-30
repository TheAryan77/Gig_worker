import { WebSocketServer } from "ws"
import http from "http"

const server = http.createServer()
const wss = new WebSocketServer({ server })

wss.on("connection", socket => {
  socket.send(JSON.stringify({ type: "connected" }))

  socket.on("message", msg => {
    const data = JSON.parse(msg.toString())
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(data))
      }
    })
  })
})

server.listen(8080)
