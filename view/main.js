// const status = document.querySelector("p#status")
const latestJumpsDOM = document.querySelectorAll(".jump#latest li")
const topJumpsDOM = document.querySelectorAll(".jump#top li")
const overlay = document.querySelector("#overlay")

const canvas = document.querySelector("canvas")
canvas.width = innerWidth;
canvas.height = innerHeight;
const c = canvas.getContext("2d")

const gradient = c.createLinearGradient(0, 0, innerWidth, innerHeight)
gradient.addColorStop(0, "hsl(250, 20%, 50%)")
gradient.addColorStop(1, "hsl(250, 20%, 20%)")

const socket = io()
const THRESHOLD = 196
const readingIndicatesJump = reading => (reading < 196)

const starPositions = Array(1000).fill().map(n => {
	return {
		x: Math.random() * innerWidth,
		y: Math.random() * innerHeight,
		radius: Math.random()
	}
})

let position = 0
const allJumps = []
let buffer = []
let latestJumps = []
let topJumps = []
let thisJump = []

let jumping = false
let wasJumping = false
const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

drawBackground()
// loop()

socket.on("dataFromNodeJS", function loop(position) {
	// requestAnimationFrame(loop)
	// If the 10 last sensor readings are above the threshold, a jump has happened
	buffer.unshift(position)
	if (buffer.length > 10) {
		buffer.pop()
	}

	const jumping = buffer.every(readingIndicatesJump)

	// Happens once when jump starts
	if (jumping && !wasJumping) {
		thisJump = []
		overlay.classList.add("jump-in-progress")
	}

	// Is called repeatedly while user is in the air
	if (jumping && wasJumping) {
		if (thisJump.length < 10000) {
			thisJump.push({ position, time: new Date() })
		}
	}

	// Happens once when the jump finishes
	if (!jumping && wasJumping) {
		overlay.classList.remove("jump-in-progress")
		allJumps.push(thisJump)

		// Add this jump to the beginning, and remove oldest jump
		latestJumps.unshift(thisJump)
		if (latestJumps.length > 5) {
			latestJumps.pop()
		}

		// Update user interface to show latest jump
		blink(latestJumpsDOM[0])
		latestJumpsDOM.forEach((li, i) => {
			if (latestJumps[i] !== undefined) {
				const j = latestJumps[i]
				const lastReading = j[j.length - 1]
				const hours = lastReading.time.getHours()
				let minutes = lastReading.time.getMinutes()
				if (minutes < 10) {
					minutes = "0" + minutes
				}

				const timeInAir = lastReading.time - j[0].time
				li.innerHTML = `(${hours}:${minutes}) ${timeInAir} ms`
			}
		})

		// Get highest jumps from allJumps list
		topJumps = allJumps.sort((a, b) => {
			const aJump = a[a.length - 1].time - a[0].time
			const bJump = b[b.length - 1].time - b[0].time
			return bJump - aJump
		}).slice(0, 5)

		// Update user interface to show top jumps
		topJumpsDOM.forEach((li, i) => {
			li.classList.remove("new-entry")
			if (topJumps[i] !== undefined) {
				const j = topJumps[i]
				const lastReading = j[j.length - 1]

				const hours = lastReading.time.getHours()
				let minutes = lastReading.time.getMinutes()
				if (minutes < 10) {
					minutes = "0" + minutes
				}

				const timeInAir = lastReading.time - j[0].time
				li.innerHTML = `(${hours}:${minutes}) ${timeInAir} ms`
				if (topJumps[i] === latestJumps[0]) {
					blink(li)
				}
			}
		})

		// A graph is drawn when user lands
		drawBackground()
		plotLatestJump()
	}

	wasJumping = jumping
})

// document.addEventListener("mousemove", function () {
// 	position = innerHeight - event.clientY
// })

function drawBackground() {
	c.fillStyle = gradient;
	c.fillRect(0, 0, innerWidth, innerHeight)

	starPositions.forEach(star => {
		c.fillStyle = "white"
		c.beginPath()
		c.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
		c.closePath()
		c.fill()
	})

	c.fillStyle = "beige"
	c.fillRect(0, innerHeight * 0.75, innerWidth, innerHeight)
}

function blink(listItem) {
	// 5 blink ser bra ut
	for (let blinkIndex = 0; blinkIndex < 9; blinkIndex++) {
		setTimeout(() => {
			if (blinkIndex % 2 == 0) {
				listItem.classList.add("new-entry")
			} else {
				listItem.classList.remove("new-entry")
			}
		}, blinkIndex * 250)
	}
}

function plotLatestJump() {
	const jump = latestJumps[0].map(jump => jump.position)
	const min = Math.min(...jump)
	const max = Math.max(...jump)
	const r = innerWidth / jump.length / Math.PI

	// Denne koden må justeres senere
	latestJumps[0].forEach((reading, i, a) => {
		const p = reading.position;
		const x = map(i, 0, a.length, 0, innerWidth)
		const y = map(p, min, max, innerHeight - 10, innerHeight - 100)
		const h = map(i, 0, a.length, 0, 360)

		c.fillStyle = `hsl(${Math.floor(h)}, 50%, 50%)`
		c.beginPath()
		c.arc(x, y, r, 0, Math.PI * 2)
		c.closePath()
		c.fill()
	})
}