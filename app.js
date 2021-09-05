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

generateWalls = (walls, type) => {
	walls.forEach((row, rowIndex) => {
		row.forEach((open, colIndex) => {
			if (open) return;
			let wall;
			const rnd = Math.floor(Math.random() * colors.length);
			if (type === 'horizontal') {
				wall = Bodies.rectangle(
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
			} else if (type === 'vertical') {
				wall = Bodies.rectangle(
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
			}

			World.add(world, wall);
		});
	});
};

generateWalls(horizontals, 'horizontal');
generateWalls(verticals, 'vertical');

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
	},
	frictionAir: 0,
	frictionStatic: 0,
	friction: 0,
	//restitution: 1, Uncomment for Arkanoid mode
	inertia: Infinity
});
World.add(world, player);

document.addEventListener('keydown', (e) => {
	const { x, y } = player.velocity;
	const speedLimit = 5;

	if (e.code === 'KeyW') {
		Body.setVelocity(player, { x, y: y - 5 });
	}

	if (e.code === 'KeyD') {
		Body.setVelocity(player, { x: x + 5, y });
	}

	if (e.code === 'KeyS') {
		Body.setVelocity(player, { x, y: y + 5 });
	}

	if (e.code === 'KeyA') {
		Body.setVelocity(player, { x: x - 5, y });
	}
});

const limitMaxSpeed = () => {
	let maxSpeed = 5;
	if (player.velocity.x > maxSpeed) {
		Body.setVelocity(player, { x: maxSpeed, y: player.velocity.y });
	}

	if (player.velocity.x < -maxSpeed) {
		Body.setVelocity(player, { x: -maxSpeed, y: player.velocity.y });
	}

	if (player.velocity.y > maxSpeed) {
		Body.setVelocity(player, { x: player.velocity.x, y: maxSpeed });
	}

	if (player.velocity.y < -maxSpeed) {
		Body.setVelocity(player, { x: -player.velocity.x, y: -maxSpeed });
	}
};

Events.on(engine, 'beforeUpdate', limitMaxSpeed);

document.addEventListener('keyup', (e) => {
	if (e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD') {
		Body.setVelocity(player, { x: 0, y: 0 });
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
