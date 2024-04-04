const canvas = document.getElementById("canvas");
function getMouseCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const xMouse = e.clientX - rect.left;
  const yMouse = e.clientY - rect.top;
  return [xMouse, yMouse];
}
const halfWidth = canvas.clientWidth / 2;
const halfHeight = canvas.clientHeight / 2;
const ctx = canvas.getContext("2d");
const info = document.getElementById("info");

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
canvas.addEventListener("mousedown", (e) => {
  const mouseCoords = getMouseCoords(e);
  if (!!(e.buttons & 1)) {
    game.setCellAt(mouseCoords, true, view);
    game.render(view);
  } else if (!!(e.buttons & 2)) {
    game.setCellAt(mouseCoords, false, view);
    game.render(view);
  } else if (!!(e.buttons & 4)) {
    panOld = view.pan;
    mouseInitial = mouseCoords;
  }

  e.preventDefault();
});
canvas.addEventListener("mousemove", (e) => {
  const mouseCoords = getMouseCoords(e);
  if (!!(e.buttons & 1)) {
    game.setCellAt(mouseCoords, true, view);
    game.render(view);
    clearInfo();
  } else if (!!(e.buttons & 2)) {
    game.setCellAt(mouseCoords, false, view);
    game.render(view);
    clearInfo();
  } else if (mouseInitial) {
    const mouseDelta = Math2D.subtract(mouseCoords, mouseInitial);
    view.pan = Math2D.add(panOld, mouseDelta);
    game.render(view);
  }
});
canvas.addEventListener("mouseup", (e) => {
  panOld = undefined;
  mouseInitial = undefined;
});
canvas.addEventListener("mouseleave", (e) => {
  panOld = undefined;
  mouseInitial = undefined;
});

canvas.addEventListener("click", (e) => {});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();

  let multiplier;
  if (e.deltaY < 0) {
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

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

const infoPanel = document.getElementById("info-text");
function clearInfo() {
  infoPanel.textContent = "";
}

function nextTick() {
  const stasisReached = game.tick(view);
  if (!stasisReached) {
    game.render(view);
  } else {
    pauseGame();
    infoPanel.textContent = "stasis reached";
  }
}

let simulationSpeedInHz = 5;
let intervalId;
function startGame() {
  if (!intervalId) {
    intervalId = setInterval(nextTick, 1000 / simulationSpeedInHz);
    playIcon.style.display = "none";
    pauseIcon.style.display = "inline";
    playPauseButton.title = "Pause";
    clearInfo();
  }
}
function pauseGame() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = undefined;
    playIcon.style.display = "inline";
    pauseIcon.style.display = "none";
    playPauseButton.title = "Play simulation";
  }
}

const clearButton = document.getElementById("clear");
clearButton.addEventListener("click", (e) => {
  pauseGame();
  game.reset();
  view.pan = [0, 0];
  game.render(view);
  clearInfo();
});

const playPauseButton = document.getElementById("play-pause");
const playIcon = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");

playPauseButton.addEventListener("click", () => {
  if (!intervalId)
    // Game is not running
    startGame();
  else pauseGame();
});

const tickButton = document.getElementById("tick");
tickButton.addEventListener("click", nextTick);

const speedSlider = document.getElementById("speed");
speedSlider.addEventListener("input", (e) => {
  simulationSpeedInHz = speedSlider.value;
  if (intervalId) {
    // Restart simulation with updated speed
    pauseGame();
    startGame();
  }
});

document.addEventListener("keydown", (e) => {
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

const helpBtn = document.getElementById("help-button");
const help = document.getElementById("help");
helpBtn.addEventListener("click", (e) => {
  help.style.display = help.style.display === "none" ? "block" : "none";
});

game.render(view);
