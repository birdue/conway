/**
 * Represents a SIZE x SIZE array of cells.
 * The array is 0-indexed (i.e. top left cell is [0, 0], and bottom right
 * cell is [SIZE-1, SIZE-1]).
 * The array is internally stored a sequence of integers, and bitwise
 * operations are used to set and retrieve cell values.
 */
class Chunk {

	/**
	 * Chunk size. The absolute maximum value is 31 because JS's bitwise operations
	 * can only be safely performed on 31-bit integers, but it's good to keep it lower
	 * than 31 just in case.
	 */
	static SIZE = 24;

	constructor() {
		this._cells = Array(Chunk.SIZE).fill(0);
	}

	/**
	 * Check if [x, y] is outside the chunk.
	 */
	_outOfBound([x, y]) {
		return x < 0 || x >= Chunk.SIZE || y < 0 || y >= Chunk.SIZE;
	}

	get([x, y]) {
		if(this._outOfBound([x, y]))
			throw new RangeError(`Invalid coord [${x}, ${y}] in chunk`);
		return !!((this._cells[x] >> y) & 1);
	}

	set([x, y], value) {
		if(this._outOfBound([x, y]))
			throw new RangeError(`Invalid coord [${x}, ${y}] in chunk`);
		value = !!value;
		if(value) this._cells[x] |= (1 << y);
		else this._cells[x] &= ~(1 << y);
	}

	/**
	 * Compute the next tick based on own cells and adjacent chunks,
	 * and store the result internally. The state should be updated on
	 * the next render() call.
	 * @param adjs a 3x3 array of adjacents. adjs[1][1] should be this chunk!
	 * @returns whether stasis has been reached within the chunk (i.e. nothing updated)
	 */
	computeNextTick(adjs) {
		console.assert(adjs[1][1] === this);

		function getCellAt([x, y]) {
			// Compute the chunk where the cell is located
			const xChunkDelta = x < 0 ? -1 : x < Chunk.SIZE ? 0 : 1;
			const yChunkDelta = y < 0 ? -1 : y < Chunk.SIZE ? 0 : 1;
			// Compute the local cell XY within the correct chunk
			const xLocal = (x + Chunk.SIZE) % Chunk.SIZE;
			const yLocal = (y + Chunk.SIZE) % Chunk.SIZE;
			
			return adjs[xChunkDelta+1][yChunkDelta+1]?.get([xLocal, yLocal]);
		}

		this._nextTick = [];
		let stasisReached = true;
		for(let x = 0; x < Chunk.SIZE; x++) {
			let c = 0;
			for(let y = 0; y < Chunk.SIZE; y++) {
				const alive = getCellAt([x, y]);
				let livingNeighbors = 0;
				// Iterate over neighbors
				for(let xDelta = -1; xDelta <= 1; xDelta++) {
					for(let yDelta = -1; yDelta <= 1; yDelta++) {
						// Skip the cell itself
						if(xDelta === 0 && yDelta === 0) continue;

						if(getCellAt([x+xDelta, y+yDelta])) livingNeighbors++;
					}
				}
				// if(alive)
				// console.log(`This alive cell at ${x},${y} has ${livingNeighbors} living neighbors`);
				if(!alive && livingNeighbors === 3) {
					c |= (1 << y);
				}
				if(alive && 2 <= livingNeighbors && livingNeighbors <= 3) {
					c |= (1 << y);
				}
			}
			stasisReached &&= c === this._cells[x];
			this._nextTick.push(c);
		}

		return stasisReached;
	}

	setNextTick() {
		console.assert(!!this._nextTick);
		this._cells = this._nextTick;
		this._nextTick = undefined;
	}

	render([xChunk, yChunk], view, config, ctx) {
		const { pan: [xPan, yPan], zoom } = view;
		const { cellSize, cellColor } = config;
		const cellSizeScreen = cellSize * zoom;
		const xOffset = xChunk*Chunk.SIZE*cellSizeScreen + xPan;
		const yOffset = yChunk*Chunk.SIZE*cellSizeScreen + yPan;

		ctx.fillStyle = cellColor;
		for(let x = 0; x < Chunk.SIZE; x++) {
			for(let y = 0, c = this._cells[x]; y < Chunk.SIZE; y++, c >>= 1) {
				if(!(c & 1)) continue;
				const xScreen = xOffset + x*cellSizeScreen;
				const yScreen = yOffset + y*cellSizeScreen;
				ctx.fillRect(xScreen, yScreen, cellSizeScreen, cellSizeScreen);
			}
		}
	
		// Draw chunk borders for debugging
		function debug() {
			ctx.strokeStyle = "black";
			ctx.lineWidth = 4;
			ctx.strokeRect(xOffset, yOffset, Chunk.SIZE*cellSizeScreen, Chunk.SIZE*cellSizeScreen);
			ctx.font = `${32*zoom}px Arial`;
			ctx.fillStyle = "gray";
			ctx.fillText(`Chunk x=${xChunk}, y=${yChunk}`, xOffset, yOffset+32*zoom);
		}
		// debug();
	}

}