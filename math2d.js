function add([x1, y1], [x2, y2]) {
	return [x1 + x2, y1 + y2];
}
function subtract([x1, y1], [x2, y2]) {
	return [x1 - x2, y1 - y2];
}
function multiply([x, y], c) {
	return [c * x, c * y];
}
function divide([x, y], d) {
	return [x / d, y / d];
}

/**
 * Convert screen (canvas) coordinates to global (2D world) coordinates.
 */
function screenToGlobal(coordScreen, view) {
	const { pan, zoom } = view;
	return divide(subtract(coordScreen, pan), zoom);
}

/**
 * Correspond a global (2D world) position to a chunk position.
 * @returns [xChunk, yChunk]
 */
function globalToChunkXY(coordGlobal, config) {
	const { cellSize } = config;
	return divide(coordGlobal, cellSize*Chunk.SIZE).map(Math.floor);
	// const xChunk = Math.floor(xGlobal/cellSize/Chunk.SIZE);
	// const yChunk = Math.floor(yGlobal/cellSize/Chunk.SIZE);
	// return [xChunk, yChunk];
}

/**
 * Get the top left (global) coordinates of a chunk.
 */
function getTopLeftOfChunk(chunkXY, config) {
	const { cellSize } = config;
	return multiply(chunkXY, Chunk.SIZE*cellSize);
	// return [xChunk*Chunk.SIZE*cellSize, yChunk*Chunk.SIZE*cellSize];
}

/**
 * Correspond a local (within-the-chunk) position to a cell.
 * @returns [x, y]
 */
function localToCell([xLocal, yLocal], config) {
	const { cellSize } = config;
	const x = Math.floor(xLocal/cellSize);
	const y = Math.floor(yLocal/cellSize);
	return [x, y];
}