var canvas, stage, exportRoot, images;
var platypii = [];
var score = 0;

function init() {
	canvas = document.getElementById("canvas");
	images = {};

	var manifest = [
		{src:"images/cliff.png", id:"cliff"},
		{src:"sounds/pop.mp3", id:"pop"}
	];

	var queue = new createjs.LoadQueue();
	// installs SoundJS as a plugin to PreloadJS, so it can handle loaded sounds correctly:
	queue.installPlugin(createjs.Sound);
	// fires when all the files are done loading:
	queue.addEventListener("complete", handleComplete);
	// fires every time a file finishes loading successfully:
	queue.addEventListener("fileload", handleFileLoad);
	queue.loadManifest(manifest);
}

function handleFileLoad(event) {
	// the published content expects to find images in the images object.
	var item = event.item;
	var type = item.type
	if (type == createjs.LoadQueue.IMAGE) { images[item.id] = event.result; }
}

function playSound(name, loop) {
	createjs.Sound.play(name, createjs.Sound.INTERRUPT_EARLY, 0, 0, loop);
}

function handleComplete() {
	exportRoot = new lib.PlatypusGame();
	exportRoot.removeChild(exportRoot.platypus);

	stage = new createjs.Stage(canvas);
	stage.addChild(exportRoot);
	
	createjs.Touch.enable(stage);

	createjs.Ticker.setFPS(20);
	// add the listener to window, so we can do some work before updating the stage:
	createjs.Ticker.addEventListener("tick", tick);
}

function tick() {
	if (platypii.length < 1 || Math.random() < 0.01 && platypii.length < 5) {
		var platypus = new lib.Platypus();
		platypus.scaleX = platypus.scaleY = Math.random()*0.3+0.3;
		platypus.x = 800;
		// nominalBounds holds the dimensions of the first frame of the symbol at export time.
		platypus.y = Math.random()*(400-platypus.scaleY*platypus.nominalBounds.height);
		platypus.velX = (1+platypus.scaleX)*-6;
		platypus.velY = 0;
		// we only want to know about clicks on the balloon, not the whole platypus:
		platypus.platypusIdle.balloon.onClick = handleBalloonClick;
		platypus.onPopped = handleBalloonPopped;
		
		platypii.push(platypus);
		exportRoot.addChild(platypus);
	}
	
	// go in reverse to make it easier to splice items from the array
	for (var i=platypii.length-1; i>=0; i--) {
		platypus = platypii[i];
		
		// add gravity to the Y velocity if it's falling:
		if (platypus.falling) { platypus.velY += 3; }
		platypus.x += platypus.velX;
		platypus.y += platypus.velY;
		
		if (platypus.x < -platypus.nominalBounds.width*platypus.scaleX || platypus.y > 400) {
			platypii.splice(i,1);
			exportRoot.removeChild(platypus);
			// add +100 points if it fell or -500 if it escaped
			updateScore(platypus.y > 400 ? 100 : -500);
		}
	}
	
	stage.update();
}

function handleBalloonClick(eventObj) {
	// eventObj.target is the balloon that was clicked. Grab the platypus instance:
	var platypus = eventObj.target.parent.parent;
	platypus.gotoAndPlay("pop");
}

function handleBalloonPopped(platypus) {
	platypus.falling = true;
}

function updateScore(delta) {
	score = Math.max(0,score + delta);
	exportRoot.scoreTxt.text = "SCORE: "+score;
}
