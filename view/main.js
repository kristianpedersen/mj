[...document.querySelectorAll("li")].forEach(li => {
	li.innerHTML = `${Math.floor(Math.random() * 300)} cm`
})

const latestJumpsDOM = document.querySelectorAll(".jump#latest li")
const leggtil = 0
const overlay = document.querySelector("#overlay")
const socket = io()
const topJumpsDOM = document.querySelectorAll(".jump#top li")

const allJumps = []
const baselineReadings = []
const buffer = []
const latestJumps = []

let baseline = 0
let jumping = false
let previousDate = new Date()
let thisJump = []
let topJumps = []
let wasJumping = false

const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;
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

					const allReadings = thisJump.map(jump => jump.distance)
					const thisJumpsHighestReading = Math.max(...allReadings) + leggtil

					li.innerHTML = `${thisJumpsHighestReading} cm`
				}
			})

			// Get highest jumps from allJumps list
			topJumps = allJumps.sort((a, b) => {
				const allA = a.map(jump => jump.distance)
				const allB = b.map(jump => jump.distance)
				const aMax = Math.max(...allA)
				const bMax = Math.max(...allB)
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

					li.innerHTML = `${thisJumpsHighestReading} cm`
					if (topJumps[i] === latestJumps[0]) {
						blink(li)
					}
				}
			})
		}

		wasJumping = jumping
	}
})

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
