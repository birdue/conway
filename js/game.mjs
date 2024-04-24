import {
	add,
	subtract,
	multiply,
	globalToChunkXY,
	screenToGlobal,
	getTopLeftOfChunk,
	localToCell,
} from "./math2d.mjs";
import Chunk from "./chunk.mjs";

export default class Game {
	static renderDistance = 2;
	static simulationDistance = 3;

	constructor(config, ctx) {
		this._config = config;
		this._ctx = ctx;
		this._halfWidth = ctx.canvas.clientWidth / 2;
		this._halfHeight = ctx.canvas.clientHeight / 2;

		this._chunks = new Map();
	}

	/**
	 * Get the chunk at [xChunk, yChunk], create it if non-existent.
	 */
	_getChunk([xChunk, yChunk]) {
		const key = `${xChunk},${yChunk}`;
		if (!this._chunks.has(key)) this._chunks.set(key, new Chunk());

		return this._chunks.get(key);
	}

	_getActiveChunkXY(view) {
		return globalToChunkXY(
			screenToGlobal([this._halfWidth, this._halfHeight], view),
			this._config,
		);
	}

	reset() {
		this._chunks = new Map();
	}

	/**
	 * Compute the next tick.
	 * The state should be updated on the next render() call.
	 * @returns whether stasis has been reached (i.e. nothing updated)
	 */
	tick(view) {
		const sd = Game.simulationDistance;

		const chunks = Array(1 + 2 * sd)
			.fill(0)
			.map(() => []);

		const active = this._getActiveChunkXY(view);

		for (let x = -sd; x <= sd; x++) {
			for (let y = -sd; y <= sd; y++) {
				chunks[x + sd][y + sd] = this._getChunk(add(active, [x, y]));
			}
		}

		let stasisReached = true;
		for (let x = -sd; x <= sd; x++) {
			for (let y = -sd; y <= sd; y++) {
				const adjs = Array(3)
					.fill(0)
					.map(() => []);
				for (let xDelta = -1; xDelta <= 1; xDelta++) {
					if (x + xDelta < -sd || x + xDelta > sd) continue;
					for (let yDelta = -1; yDelta <= 1; yDelta++) {
						if (y + yDelta < -sd || y + yDelta > sd) continue;
						adjs[xDelta + 1][yDelta + 1] =
							chunks[x + xDelta + sd][y + yDelta + sd];
					}
				}
				stasisReached =
					chunks[x + sd][y + sd].computeNextTick(adjs) && stasisReached;
			}
		}

		for (let x = -sd; x <= sd; x++) {
			for (let y = -sd; y <= sd; y++) {
				// console.log(`going to set next tick for ${[x+sd,y+sd]}`)
				chunks[x + sd][y + sd].setNextTick();
			}
		}

		return stasisReached;
	}

	render(view) {
		const rd = Game.renderDistance;
		const ctx = this._ctx,
			config = this._config;
		const {
			pan: [xPan, yPan],
			zoom,
		} = view;
		const { gridColor, cellSize } = config;
		const cellSizeScreen = cellSize * zoom;

		const active = this._getActiveChunkXY(view);

		this._ctx.clearRect(0, 0, this._halfWidth * 2, this._halfHeight * 2);

		for (let xDelta = -rd; xDelta <= rd; xDelta++) {
			for (let yDelta = -rd; yDelta <= rd; yDelta++) {
				const [x, y] = add(active, [xDelta, yDelta]);
				this._getChunk([x, y]).render([x, y], view, config, ctx);
			}
		}

		const [xTopLeft, yTopLeft] = add(
			multiply(subtract(active, [rd, rd]), Chunk.SIZE * cellSizeScreen),
			[xPan, yPan],
		);

		// Draw grid lines
		ctx.strokeStyle = gridColor;
		ctx.lineWidth = 0.5;
		ctx.beginPath();
		for (let x = 0; x <= Chunk.SIZE * (1 + 2 * rd); x++) {
			const xScreen = xTopLeft + x * cellSizeScreen;
			ctx.moveTo(xScreen, yTopLeft);
			ctx.lineTo(
				xScreen,
				yTopLeft + Chunk.SIZE * (1 + 2 * rd) * cellSizeScreen,
			);
		}
		for (let y = 0; y <= Chunk.SIZE * (1 + 2 * rd); y++) {
			const yScreen = yTopLeft + y * cellSizeScreen;
			ctx.moveTo(xTopLeft, yScreen);
			ctx.lineTo(
				xTopLeft + Chunk.SIZE * (1 + 2 * rd) * cellSizeScreen,
				yScreen,
			);
		}
		ctx.stroke();
	}

	setCellAt([xScreen, yScreen], value, view) {
		const config = this._config;

		const global = screenToGlobal([xScreen, yScreen], view);
		const chunkXY = globalToChunkXY(global, config);
		const local = subtract(global, getTopLeftOfChunk(chunkXY, config));
		const cell = localToCell(local, config);
		this._getChunk(chunkXY).set(cell, value);
	}
}
