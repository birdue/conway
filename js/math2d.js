exports.add = function ([x1, y1], [x2, y2]) {
	return [x1 + x2, y1 + y2];
};
exports.subtract = function ([x1, y1], [x2, y2]) {
	return [x1 - x2, y1 - y2];
};
exports.multiply = function ([x, y], c) {
	return [c * x, c * y];
};
exports.divide = function ([x, y], d) {
	return [x / d, y / d];
};

/**
 * Convert screen (canvas) coordinates to global (2D world) coordinates.
 */
exports.screenToGlobal = function (coordScreen, view) {
	const { pan, zoom } = view;
	return exports.divide(exports.subtract(coordScreen, pan), zoom);
};
