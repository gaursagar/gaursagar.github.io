window.onload = function() {
	var canvas = document.getElementById('scratchpad');
	var context = canvas.getContext('2d');
	var width   = canvas.width  = window.innerWidth
	var height  = canvas.height = window.innerHeight;

	function rInt(min = -350, max = 350) {
		return Math.floor(Math.random() * (max - min)) + min;
	}

	// Equilateral Coordinates
	var p0 = {x: 0   , y:-321};
	var p1 = {x: 278 , y: 160};
	var p2 = {x:-278 , y: 160};

	// Random Coordinates : Looks like shit
	// var p0 = {x: rInt() , y: rInt()};
	// var p1 = {x: rInt() , y: rInt()};
	// var p2 = {x: rInt() , y: rInt()};
	var r  = 0;
	depth  = 7;
	change = 1;
	limit  = 8;
	draw();

	function draw() {
		context.clearRect(0, 0, width, height);
		context.save();
		context.translate(canvas.width/2, canvas.height/2)
		context.rotate(r += 0.01);
		
		// Uncomment to change depth
			if (depth == limit) 
				change = -1;
			if (depth == 0)
				change = 1;
			depth += change;

		sierpinski(p0, p1, p2, depth);
		context.restore();
		requestAnimationFrame(draw);
		sleepFor(10);
	}

	function sierpinski(p0, p1, p2, depth) {
		if (depth == 0) {
			drawTriangle(p0, p1, p2);
		}
		else {
			var pA = {
					x: (p0.x + p1.x) / 2,
					y: (p0.y + p1.y) / 2,
				};
			var pB = {
					x: (p1.x + p2.x) / 2,
					y: (p1.y + p2.y) / 2,
				};
			var pC = {
					x: (p0.x + p2.x) / 2,
					y: (p0.y + p2.y) / 2,
				};
	
			sierpinski(p0, pA, pC, depth - 1);
			sierpinski(pA, p1, pB, depth - 1);
			sierpinski(pC, pB, p2, depth - 1);
		}
	}

	function drawTriangle(p0, p1, p2) {
		context.beginPath();
		context.moveTo(p0.x, p0.y);
		context.lineTo(p1.x, p1.y);
		context.lineTo(p2.x, p2.y);
		context.fill();
	}

	function sleepFor(sleepDuration) {
    	var now = new Date().getTime();
    	while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
	}
};