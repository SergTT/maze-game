const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;
const cellsHorizontal = 5;
const cellsVertical = 5;
const width = window.innerWidth;
const height = window.innerHeight;
const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;
const unitWidth = unitLengthX / 20;
const colors = [ 'orange', 'green', 'yellow', 'red', 'blue', 'violet', 'gray', 'purple', 'white' ];

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		wireframes: false,
		width,
		height
	}
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
	Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
	Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
	Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
	Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];

World.add(world, walls);

// Grid
const shuffle = (arr) => {
	for (let i = arr.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[ arr[i], arr[j] ] = [ arr[j], arr[i] ];
	}
	return arr;
};

const grid = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal).fill(false));
const verticals = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal - 1).fill(false));
const horizontals = Array(cellsVertical - 1).fill(null).map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThrougCell = (row, column) => {
	if (grid[row][column]) return;

	grid[row][column] = true;

	const neighbors = shuffle([
		[ row + 1, column, 'down' ],
		[ row, column + 1, 'right' ],
		[ row - 1, column, 'up' ],
		[ row, column - 1, 'left' ]
	]);

	for (let neighbor of neighbors) {
		const [ nextRow, nextColumn, direction ] = neighbor;
		if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) continue;

		if (grid[nextRow][nextColumn]) continue;

		if (direction === 'left') {
			verticals[row][column - 1] = true;
		} else if (direction === 'right') {
			verticals[row][column] = true;
		} else if (direction === 'up') {
			horizontals[row - 1][column] = true;
		} else if (direction === 'down') {
			horizontals[row][column] = true;
		}

		stepThrougCell(nextRow, nextColumn);
	}
};

stepThrougCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
	row.forEach((open, colIndex) => {
		if (open) return;
		const rnd = Math.floor(Math.random() * colors.length);
		const wall = Bodies.rectangle(
			colIndex * unitLengthX + unitLengthX / 2,
			rowIndex * unitLengthY + unitLengthY,
			unitLengthX,
			unitWidth,
			{
				label: 'wall',
				isStatic: true,
				render: {
					fillStyle: colors[rnd],
					wireframes: false
				}
			}
		);

		World.add(world, wall);
	});
});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, colIndex) => {
		if (open) return;
		const rnd = Math.floor(Math.random() * colors.length);
		const wall = Bodies.rectangle(
			colIndex * unitLengthX + unitLengthX,
			rowIndex * unitLengthY + unitLengthY / 2,
			unitWidth,
			unitLengthY,
			{
				label: 'wall',
				isStatic: true,
				render: {
					fillStyle: colors[rnd],
					wireframes: false
				}
			}
		);

		World.add(world, wall);
	});
});

// Goal
const goal = Bodies.rectangle(width - unitLengthX / 2, height - unitLengthY / 2, unitLengthX * 0.5, unitLengthY * 0.5, {
	isStatic: true,
	label: 'goal',
	render: {
		fillStyle: 'orange'
	}
});
World.add(world, goal);

// Player
const playerRadius = Math.min(unitLengthX, unitLengthY) / 4;
const player = Bodies.circle(unitLengthX / 2, unitLengthY / 2, playerRadius, {
	isStatic: false,
	label: 'player',
	render: {
		fillStyle: 'blue'
	}
});
World.add(world, player);

document.addEventListener('keydown', () => {
	const { x, y } = player.velocity;
	const speedLimit = 5;

	if (event.keyCode === 87 && y > -speedLimit) {
		Body.setVelocity(player, { x, y: y - 5 });
	}

	if (event.keyCode === 68 && x < speedLimit) {
		Body.setVelocity(player, { x: x + 5, y });
	}

	if (event.keyCode === 83 && y < speedLimit) {
		Body.setVelocity(player, { x, y: y + 5 });
	}

	if (event.keyCode === 65 && x > -speedLimit) {
		Body.setVelocity(player, { x: x - 5, y });
	}
});

// Win condition
const labels = [ 'player', 'goal' ];
Events.on(engine, 'collisionStart', (event) => {
	event.pairs.forEach((collision) => {
		if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
			document.querySelector('.winner').classList.remove('hidden');
			world.gravity.y = 1;
			world.bodies.map((body) => {
				if (body.label === 'wall') Body.setStatic(body, false);
			});
		}
	});
});
