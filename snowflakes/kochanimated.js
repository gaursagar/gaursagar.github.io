
window.onload = function() {
	var canvas = document.getElementById("canvas"),
		context = canvas.getContext("2d"),
		width = canvas.width = window.innerWidth,
		height = canvas.height = window.innerHeight;


	function rInt(min = -350, max = 350) {
		return Math.floor(Math.random() * (max - min)) + min;
	}
	// Random Coordinates : Looks like shit
	// var p0 = {x: rInt(1, 400) , y: rInt(1, 400)};
	// var p1 = {x: p0.x, y: -1 * p0.y};
	// var p2 = {x: -1 * p1.x , y: p1.y};
	// var p3 = {x: -1*p0.x , y: p0.y};

	// Regulat Hexagon 
	var p0 = {x: rInt(1, 300) , y: rInt(1, 300)};
	var p1 = {
			x: p0.x * Math.cos(Math.PI/3) + p0.y * Math.sin(Math.PI/3),
			y: p0.y * Math.cos(Math.PI/3) - p0.x * Math.sin(Math.PI/3)
		}
	var p2 = {
			x: p1.x * Math.cos(Math.PI/3) + p1.y * Math.sin(Math.PI/3),
			y: p1.y * Math.cos(Math.PI/3) - p1.x * Math.sin(Math.PI/3)
		}
	var p3 = {
			x: -p0.x,
			y: -p0.y 
		}
	var p4 = {
			x: -p1.x,
			y: -p1.y 
		}
	var p5 = {
			x: -p2.x,
			y: -p2.y 
		}
	// var p0 = {
	// 		x: 0,
	// 		y: -321
	// 	},
	// 	p1 = {
	// 		x: 278,
	// 		y: 160
	// 	},
	// 	p2 = {
	// 		x: -278,
	// 		y: 160
	// 	};

	var a = 0,
		t = 0,
		r = 0;

	draw();

	function draw() {
		t = 1 / 3 + Math.sin(a += 0.02) * 1/18;
		// t = 1/3;
		context.clearRect(0, 0, width, height);
		context.save();
		context.translate(width / 2, height / 2);
		context.rotate(r += 0.01);
		koch(p0, p1, 4);
		koch(p1, p2, 4);
		koch(p2, p3, 4);
		koch(p3, p4, 4);
		koch(p4, p5, 4);
		koch(p5, p0, 4);
		context.restore();
		requestAnimationFrame(draw);
	}

	function koch(p0, p1, limit) {
		var dx = p1.x - p0.x,
			dy = p1.y - p0.y,
			dist = Math.sqrt(dx * dx + dy * dy),
			unit = dist * t,
			angle = Math.atan2(dy, dx),
			pA = {
				x: p0.x + dx * t,
				y: p0.y + dy * t
			},
			pC = {
				x: p1.x - dx * t,
				y: p1.y - dy * t
			},
			pB = {
				x: pA.x + Math.cos(angle - Math.PI * t) * unit,
				y: pA.y + Math.sin(angle - Math.PI * t) * unit
			};


		if(limit > 0) {
			koch(p0, pA, limit - 1);
			koch(pA, pB, limit - 1);
			koch(pB, pC, limit - 1);
			koch(pC, p1, limit - 1);
		}
		else {
			context.beginPath();
			context.moveTo(p0.x, p0.y);
			context.lineTo(pA.x, pA.y);
			context.lineTo(pB.x, pB.y);
			context.lineTo(pC.x, pC.y);
			context.lineTo(p1.x, p1.y);
			context.stroke();
		}
	}


};