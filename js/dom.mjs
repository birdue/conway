import { add, divide, subtract } from "./math2d.mjs";
import Game from "./game.mjs";
import $ from "jquery";

$(document).on("DOMContentLoaded", () => {
	const canvas = $("#canvas");
	const rect = canvas[0].getBoundingClientRect();
	const ctx = canvas[0].getContext("2d");
	const [halfWidth, halfHeight] = divide([canvas.width(), canvas.height()], 2);
	function getMouseCoords(e) {
		const [xMouse, yMouse] = subtract(
			[e.clientX, e.clientY],
			[rect.left, rect.top],
		);
		return [xMouse, yMouse];
	}

	const infoPanel = $("#info-text");

	const config = {
		cellSize: 30,
		cellColor: "lightblue",
		gridColor: "black",
		zoomMultiplier: 1.1,
		minZoom: 0.2,
		maxZoom: 3,
	};
	const game = new Game(config, ctx);

	let view = {
		pan: [0, 0],
		zoom: 1,
	};

	let panOld, mouseInitial;
	canvas.on("mousedown", (e) => {
		e.preventDefault();
		const mouseCoords = getMouseCoords(e);

		if (e.buttons & 1) {
			game.setCellAt(mouseCoords, true, view);
			game.render(view);
		} else if (e.buttons & 2) {
			game.setCellAt(mouseCoords, false, view);
			game.render(view);
		} else if (e.buttons & 4) {
			panOld = view.pan;
			mouseInitial = mouseCoords;
		}
	});

	canvas.on("mousemove", (e) => {
		const mouseCoords = getMouseCoords(e);
		if (e.buttons & 1) {
			game.setCellAt(mouseCoords, true, view);
			game.render(view);
			infoPanel.text("");
		} else if (e.buttons & 2) {
			game.setCellAt(mouseCoords, false, view);
			game.render(view);
			infoPanel.text("");
		} else if (mouseInitial) {
			const mouseDelta = subtract(mouseCoords, mouseInitial);
			view.pan = add(panOld, mouseDelta);
			game.render(view);
		}
	});
	canvas.on("mouseup", (e) => {
		panOld = undefined;
		mouseInitial = undefined;
	});
	canvas.on("mouseleave", (e) => {
		panOld = undefined;
		mouseInitial = undefined;
	});

	canvas.on("wheel", (e) => {
		e.preventDefault();

		let multiplier;
		if (e.originalEvent.deltaY < 0) {
			// Scroll up
			multiplier = config.zoomMultiplier;
		} else {
			// Scroll down
			multiplier = 1 / config.zoomMultiplier;
		}
		const zoomNew = view.zoom * multiplier;
		if (zoomNew < config.minZoom || zoomNew > config.maxZoom) return;

		view.zoom = zoomNew;
		if (Math.abs(view.zoom - 1) < 0.0001) view.zoom = 1;
		view.pan[0] += (1 - multiplier) * (halfWidth - view.pan[0]);
		view.pan[1] += (1 - multiplier) * (halfHeight - view.pan[1]);

		game.render(view);
	});

	canvas.on("contextmenu", (e) => {
		e.preventDefault();
	});

	function nextTick() {
		const stasisReached = game.tick(view);
		if (!stasisReached) {
			game.render(view);
		} else {
			pauseGame();
			infoPanel.text("stasis reached");
		}
	}

	const playPauseButton = $("#play-pause");
	const playIcon = $("#play-icon");
	const pauseIcon = $("#pause-icon");

	let simulationSpeedInHz = 5;
	let intervalId;
	function startGame() {
		if (!intervalId) {
			intervalId = setInterval(nextTick, 1000 / simulationSpeedInHz);
			playIcon.toggle();
			pauseIcon.toggle();
			playPauseButton.attr("title", "Pause");
			infoPanel.text("");
		}
	}
	function pauseGame() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = undefined;
			playIcon.toggle();
			pauseIcon.toggle();
			playPauseButton.attr("title", "Play simulation");
		}
	}

	const clearButton = $("#clear");
	clearButton.on("click", (e) => {
		pauseGame();
		game.reset();
		view.pan = [0, 0];
		game.render(view);
		infoPanel.text("");
	});

	playPauseButton.on("click", () => {
		if (!intervalId)
			// Game is not running
			startGame();
		else pauseGame();
	});

	const tickButton = $("#tick");
	tickButton.on("click", nextTick);

	const speedSlider = $("#speed");
	speedSlider.on("input", (e) => {
		simulationSpeedInHz = speedSlider.value;
		if (intervalId) {
			// Restart simulation with updated speed
			pauseGame();
			startGame();
		}
	});

	$(document).on("keydown", (e) => {
		switch (e.key) {
			case " ":
				if (!intervalId) startGame();
				else pauseGame();
				e.preventDefault();
				break;
			case "ArrowRight":
				nextTick();
				e.preventDefault();
				break;
		}
	});

	const helpBtn = $("#help-button");
	const help = $("#help");
	helpBtn.on("click", (e) => {
		help.toggle();
	});

	game.render(view);
});
