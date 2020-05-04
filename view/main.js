const leggtil = 10
// const status = document.querySelector("p#status")
const latestJumpsDOM = document.querySelectorAll(".jump#latest li")
const topJumpsDOM = document.querySelectorAll(".jump#top li")
const overlay = document.querySelector("#overlay")

/*
const canvas = document.querySelector("canvas")
canvas.width = innerWidth;
canvas.height = innerHeight;
const c = canvas.getContext("2d")

const gradient = c.createLinearGradient(0, 0, innerWidth, innerHeight)
gradient.addColorStop(0, "hsl(250, 20%, 50%)")
gradient.addColorStop(1, "hsl(250, 20%, 20%)")
*/

const socket = io()

const starPositions = Array(1000).fill().map(n => {
	return {
		x: Math.random() * innerWidth,
		y: Math.random() * innerHeight,
		radius: Math.random() * 2
	}
})

const allJumps = []
const baselineReadings = []
const buffer = []
const latestJumps = []
let topJumps = []
let thisJump = []
let baseline = 0
let jumping = false
let wasJumping = false
let previousDate = new Date()

const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

//drawBackground()
// loop()

const programStart = new Date()

socket.on("dataFromNodeJS", function getDistance(position) {
	position = Number(position)

	if (baselineReadings.length < 100 && !isNaN(position) && new Date() - programStart > 1000) {
		baselineReadings.push(position)
	}
	else if (baselineReadings.length === 100) {
		baseline = Math.floor(
			baselineReadings.reduce((a, b) => a + b, 0) / baselineReadings.length
		)
		// baseline -= 30
		baselineReadings.push(position)
		console.log("Baseline = " + baseline);
	}
	else if (baselineReadings.length > 100) {
		// Buffer is a fixed length array with the n latest readings
		buffer.unshift(position)
		if (buffer.length > 10) {
			buffer.pop()
		}

		// If the 10 last sensor readings are above the threshold, a jump has happened
		const jumping = buffer.every(reading => reading < baseline - 30)

		// Happens once when jump starts
		if (jumping && !wasJumping) {
			thisJump = []
			overlay.classList.add("jump-in-progress")
		}

		// Is called repeatedly while user is in the air
		if (jumping && wasJumping) {
			if (thisJump.length < 1000000) {
				const reading = {
					distance: baseline - position,
					time: new Date()
				}
				thisJump.push(reading)
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
			latestJumps[0]
			blink(latestJumpsDOM[0])
			latestJumpsDOM.forEach((li, i) => {
				if (latestJumps[i] !== undefined) {
					const thisJump = latestJumps[i]
					const lastReading = thisJump[thisJump.length - 1]
					const hours = lastReading.time.getHours()
					let minutes = lastReading.time.getMinutes()

					if (minutes < 10) {
						minutes = "0" + minutes
					}

					// const timeInAir = lastReading.time - j[0].time
					const allReadings = thisJump.map(jump => jump.distance)
					const thisJumpsHighestReading = Math.max(...allReadings) + leggtil

					li.innerHTML = `(${hours}:${minutes}) ${thisJumpsHighestReading} cm`
				}
			})

			// Get highest jumps from allJumps list
			topJumps = allJumps.sort((a, b) => {
				const allA = a.map(jump => jump.distance)
				const allB = b.map(jump => jump.distance)
				const aMax = Math.max(...allA)
				const bMax = Math.max(...allB)
				// const bJump = b.map(jump => jump.distance)
				// const bJump = b[b.length - 1].height - b[0].height
				return bMax - aMax
			}).slice(0, 5)

			// Update user interface to show top jumps
			topJumpsDOM.forEach((li, i) => {
				li.classList.remove("new-entry")
				if (topJumps[i] !== undefined) {
					const thisJump = topJumps[i]
					const lastReading = thisJump[thisJump.length - 1]

					const hours = lastReading.time.getHours()
					let minutes = lastReading.time.getMinutes()
					if (minutes < 10) {
						minutes = "0" + minutes
					}

					const allReadings = thisJump.map(jump => jump.distance)
					const thisJumpsHighestReading = Math.max(...allReadings) + leggtil

					// const timeInAir = lastReading.time - thisJump[0].time
					li.innerHTML = `(${hours}:${minutes}) ${thisJumpsHighestReading} cm`
					if (topJumps[i] === latestJumps[0]) {
						blink(li)
					}
				}
			})

			// A graph is drawn when user lands
			// drawBackground()
			// plotLatestJump()
		}

		wasJumping = jumping
	}
})

/*
function drawBackground() {
	c.fillStyle = gradient;
	c.fillRect(0, 0, innerWidth, innerHeight)

	starPositions.forEach((star, index) => {
		c.fillStyle = [
			"white",
			"hsl(200, 50%, 70%)",
			"hsl(210, 50%, 80%)", 
			"hsl(220, 50%, 90%)", 
			"hsl(20, 50%, 80%)", 
		][index % 5]
		c.beginPath()
		c.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
		c.closePath()
		c.fill()
	})
}
*/

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

/*
function plotLatestJump() {
	c.fillStyle = "beige"
	c.fillRect(0, innerHeight * 0.75, innerWidth, innerHeight)
	
	const jump = latestJumps[0].map(jump => jump.distance)
	const min = Math.min(...jump)
	const max = Math.max(...jump)
	const r = innerWidth / jump.length / Math.PI

	// Denne koden må justeres senere
	latestJumps[0].forEach((reading, i, a) => {
		const p = reading.distance;
		const x = map(i, 0, a.length, 0, innerWidth)
		const y = map(p, min, max, innerHeight - 10, innerHeight - 100)
		const h = map(i, 0, a.length, 0, 360)

		c.fillStyle = `hsl(${Math.floor(h)}, 50%, 50%)`
		c.beginPath()
		c.arc(x, y, r, 0, Math.PI * 2)
		c.closePath()
		c.fill()
	})
}*/
