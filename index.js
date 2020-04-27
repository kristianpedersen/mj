const COM_PORT = "COM35"

const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

app.use(express.static('view'))

console.log("Tilgjengelige seriellporter:")
SerialPort.list()
	.then(p => {
		p.forEach(port => {
			console.log(port.path)
		})
	})
const port = new SerialPort(COM_PORT, { baudRate: 115200 })
const parser = new Readline()
port.pipe(parser)
console.log("http://localhost:3000")

let count = 0

app.get('/', function serveIndexHtml(req, res) {
	res.sendFile(__dirname + '/index.html')
})

io.on('connection', function socketSetup() {
	console.log("Nettleser åpen");
	parser.on('data', function receiveTFMiniData(line) {
		io.emit("dataFromNodeJS", line)

		const hours = new Date().getUTCHours()
		let minutes = new Date().getUTCMinutes()
		if (minutes < 10) {
			minutes = "0" + minutes
		}

		console.log(`${count}: (${hours}:${minutes}) ${line}`)

		count++
		count %= Number.MAX_SAFE_INTEGER
	})
})

http.listen(3000)