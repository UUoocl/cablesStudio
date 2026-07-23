/******************
Code by Vamoss
Original code link:
https://openprocessing.org/sketch/2218844

Author links:
http://vamoss.com.br
http://twitter.com/vamoss
http://github.com/vamoss
******************/

//original idea from Yugo Nakamura for a poster created to TOKYO TDC
//https://twitter.com/TokyoTDC/status/1770993934258565530

let message = "CABLES";
let fontSize = 100;
let rangeX = 0.2;
let rangeY = 0.2;
let lineMultiplication = 10;
let lineOpacity = 0.6;
let lineWidth = 0.3;
let randomness = 0.2;
let crop = 0;
let messageMouseX = 300;
let messageMouseY = 300;

lineOpacity

let messageSize;
let font;
let finalWidth;
let pointsIn, pointsOut;
let lettersImages;

//ui
let input, sliderFontSize, sliderLineMultiplication, sliderRange, slideRandomness, sliderCrop;

function preload() {
	font = 'Bebas Neue';
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	pixelDensity(1);

	noStroke();
	fill(0);

	//ui
	input = createInput(message);
	input.position(10, 20);
	input.input(onMessageChange);
	input.size(80);

	sliderFontSize = createSlider(60, 600, fontSize, 1);
	sliderFontSize.position(10, 50);
	sliderFontSize.input(onMessageChange);
	sliderFontSize.size(80);
	createSpan('font size').position(100, 50);

	sliderLineMultiplication = createSlider(1, 40, lineMultiplication, 1);
	sliderLineMultiplication.position(10, 70);
	sliderLineMultiplication.input(onMessageChange);
	sliderLineMultiplication.size(80);
	createSpan('line amount').position(100, 70);

	sliderLineOpacity = createSlider(0.2, 1, lineOpacity, 0.001);
	sliderLineOpacity.position(10, 90);
	sliderLineOpacity.input(onMessageChange);
	sliderLineOpacity.size(80);
	createSpan('line opacity').position(100, 90);

	sliderLineWidth = createSlider(0, 1, lineWidth, 0.001);
	sliderLineWidth.position(10, 110);
	sliderLineWidth.input(onMessageChange);
	sliderLineWidth.size(80);
	createSpan('line width').position(100, 110);

	sliderRangeX = createSlider(0, 1, rangeX, 0.001);
	sliderRangeX.position(10, 130);
	sliderRangeX.input(onMessageChange);
	sliderRangeX.size(80);
	createSpan('spread x').position(100, 130);

	sliderRangeY = createSlider(0, 1, rangeY, 0.001);
	sliderRangeY.position(10, 150);
	sliderRangeY.input(onMessageChange);
	sliderRangeY.size(80);
	createSpan('spread y').position(100, 150);

	slideRandomness = createSlider(0, 1, randomness, 0.001);
	slideRandomness.position(10, 170);
	slideRandomness.input(onMessageChange);
	slideRandomness.size(80);
	createSpan('randomness').position(100, 170);

	sliderCrop = createSlider(0, 1, crop, 0.001);
	sliderCrop.position(10, 190);
	sliderCrop.input(onMessageChange);
	sliderCrop.size(80);
	createSpan('crop').position(100, 190);
	onMessageChange();
}

function draw() {
	background(255);
	randomSeed(0);

	var distX = messageMouseX / width;
	var distY = messageMouseY / height;
	var startX = round((width - finalWidth) * distX);
	var endX = round((width - finalWidth) * (1 - distX));
	var startY = height * distY;
	var endY = height * (1 - distY);

	//draw letters
	lettersImages.forEach(graph => {
		image(graph, round(graph.x + startX), startY, graph.width, graph.height / 2 - crop, 0, 0, graph.width, graph.height / 2 - crop);

		let xx = graph.x + endX;
		let yy = endY - graph.height / 2;
		image(graph, xx, yy, graph.width, graph.height, 0, graph.height / 2 + crop, graph.width, graph.height + crop);
	});

	if (pointsIn.length == 0 || pointsOut.length == 0)
		return;

	//draw connections
	strokeWeight(lineWidth);
	stroke(0);
	const gradient = drawingContext.createLinearGradient(startX, startY + lettersImages[0].height / 2, startX, endY - lettersImages[0].height / 2);
	gradient.addColorStop(0, "black");
	gradient.addColorStop(0.3, "rgba(0, 0, 0, " + lineOpacity + ")");
	gradient.addColorStop(0.5, "rgba(0, 0, 0, " + (lineOpacity * lineOpacity) + ")");
	gradient.addColorStop(0.7, "rgba(0, 0, 0, " + lineOpacity + ")");
	gradient.addColorStop(1, "black");
	drawingContext.strokeStyle = gradient;
	// stroke(0, lineOpacity*255);
	noFill();
	pointsIn.forEach((coord, index) => {
		for (var d = 0; d < lineMultiplication; d++) {
			const endCoord = random() > randomness ? pointsOut[floor(map(index, 0, pointsIn.length, 0, pointsOut.length))] : random(pointsOut);
			const controlY = random(-rangeY, rangeY);
			const anchorX1 = coord.x + startX + 0.5;//+0.5 to fix antialias
			const anchorY1 = coord.y + startY - 1;//-1 to fix gap
			const anchorX2 = endCoord.x + endX + 0.5;
			const anchorY2 = endY - endCoord.y + 1 + crop;
			const controlX1 = lerp(anchorX1, width / 2, random(rangeX));
			const controlY1 = lerp(anchorY1, anchorY2, 0.8 + controlY);
			const controlX2 = lerp(anchorX2, width / 2, random(rangeX));
			const controlY2 = lerp(anchorY1, anchorY2, 0.2 + controlY);
			bezier(anchorX1, anchorY1,
				controlX1, controlY1,
				controlX2, controlY2,
				anchorX2, anchorY2);
		}
	})
}

function onMessageChange() {
	message = input.value();
	fontSize = sliderFontSize.value();
	lineMultiplication = sliderLineMultiplication.value();
	lineOpacity = sliderLineOpacity.value();
	lineWidth = sliderLineWidth.value();
	rangeX = sliderRangeX.value();
	rangeY = sliderRangeY.value();
	randomness = slideRandomness.value();
	messageSize = Math.hypot(innerWidth, innerHeight) / Math.hypot(1920, 1080) * fontSize
	crop = floor(map(sliderCrop.value(), 0, 1, 0, messageSize / 2 * 0.8));

	/*
	console.log(
		"fontSize", fontSize,
		"lineMultiplication", lineMultiplication,
		"lineOpacity", lineOpacity,
		"lineWidth", lineWidth,
		"rangeX", rangeX,
		"rangeY", rangeY,
		"randomness", randomness,
	)
	/**/


	pointsIn = [];
	pointsOut = [];
	lettersImages = [];

	textFont(font);
	textSize(messageSize);

	var x = 0;
	finalWidth = textWidth(message);

	[...message].forEach(char => {
		var tW = ceil(textWidth(char));
		var graph = createGraphics(tW, messageSize);
		// graph.background(255, 0, 0);
		graph.textFont(font);
		graph.textSize(messageSize);
		graph.textAlign(CENTER, CENTER);
		graph.text(char, graph.width / 2, graph.height / 2 * 0.8);
		graph.x = round(x);
		lettersImages.push(graph);
		graph.loadPixels();

		const pD = graph.pixelDensity();
		const yIn = (graph.width * pD) * floor((graph.height / 2 - crop) * pD) * 4;
		const yOut = (graph.width * pD) * floor((graph.height / 2 + crop) * pD) * 4;
		for (let i = 0; i < graph.width; i++) {
			const alphaIndexIn = i * 4 * pD + yIn + 3;
			const alphaIndexOut = i * 4 * pD + yOut + 3;
			let alphaIn = graph.pixels[alphaIndexIn];
			let alphaOut = graph.pixels[alphaIndexOut];
			if (alphaIn > 100) {
				pointsIn.push({
					x: i + x,
					y: graph.height / 2 - crop
				});
			}
			if (alphaOut > 100) {
				pointsOut.push({
					x: i + x,
					y: graph.height / 2 + crop
				});
			}
		}

		x += tW;
	});
}