const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

console.log("Tilgjengelige seriellporter:")
SerialPort.list().then(p => p.forEach(port => console.log(port.path))) // Arduino er koblet til COM6 på testmaskinen min
const port = new SerialPort("COM6", { baudRate: 115200 })
const parser = new Readline()
port.pipe(parser)

app.get('/', function serveIndexHtml(req, res) {
	res.sendFile(__dirname + '/index.html')
})

io.on('connection', function socketSetup(socket) {
	parser.on('data', function receiveTFMiniData(line) {
		io.emit("dataFromNodeJS", line)
		//console.log(line)
	})
})

http.listen(3000)