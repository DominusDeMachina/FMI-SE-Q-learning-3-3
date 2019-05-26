const MAZE_DIMENSION_X = 10;
const MAZE_DIMENSION_Y = 10;
const PLATE_SIZE = 100;

const START_STATE_IDX = 90;
const END_STATE_IDX = 39;


const ACTIONS = [
  { x: 0, y: -1 }, // UP
  { x: 0, y: 1 }, // DOWN
  { x: -1, y: 0 }, // LEFT
  { x: 1, y: 0 } // RIGHT
];

/**
 * 0 - empty
 * 1 - block
 * 2 - hole
 * 3 - visited
 */
const state = [
  0, 0, 1, 1, 1, 0, 1, 0, 0, 1,
  0, 0, 1, 0, 0, 0, 0, 0, 1, 1,
  0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
  0, 1, 0, 0, 0, 1, 0, 1, 1, 0,
  0, 0, 0, 1, 0, 1, 0, 0, 0, 0,
  1, 0, 0, 0, 0, 0, 0, 1, 0, 1,
  1, 1, 0, 1, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 1, 0, 1, 0, 0,
  1, 0, 1, 0, 0, 1, 0, 0, 0, 1,
  0, 0, 1, 1, 0, 0, 0, 0, 1, 1
];

let canvas;
let ctx;
let player;
let maze = Array(100);
let isEnd = false;

function getCoordinatesFromState(stateIdx) {
  return {
    y: Math.trunc(stateIdx / MAZE_DIMENSION_Y),
    x: stateIdx % MAZE_DIMENSION_X
  };
}

function getStateFromCoordinates(x, y) {
  return y * MAZE_DIMENSION_Y + x;
}

class Player {
  constructor(stateIdx) {
    this.x = getCoordinatesFromState(stateIdx).x;
    this.y = getCoordinatesFromState(stateIdx).y;
    this.radius = 40;
    this.color = "#0F0";
  }

  drawPlayer() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(
      this.x * PLATE_SIZE + PLATE_SIZE / 2,
      this.y * PLATE_SIZE + PLATE_SIZE / 2,
      this.radius,
      0 * Math.PI,
      2 * Math.PI
    );
    ctx.fill();
  }
}

class Plate {
  constructor(stateIdx) {
    this.width = PLATE_SIZE;
    this.height = PLATE_SIZE;
    this.x = getCoordinatesFromState(stateIdx).x;
    this.y = getCoordinatesFromState(stateIdx).y;
    this.type = state[stateIdx];
    this.end = stateIdx === END_STATE_IDX ? true : false;
  }
  drawPlate() {
    ctx.beginPath();
    switch (this.type) {
      case 0:
        if (this.end) {
          ctx.fillStyle = "yellow";
          ctx.fillRect(this.x * PLATE_SIZE, this.y * PLATE_SIZE, this.width, this.height);
        } else {
          ctx.strokeStyle = "black";
          ctx.rect(this.x * PLATE_SIZE, this.y * PLATE_SIZE, this.width, this.height);
          ctx.stroke();
        }
        break;
      case 1:
        ctx.fillStyle = "black";
        ctx.fillRect(this.x * PLATE_SIZE, this.y * PLATE_SIZE, this.width, this.height);
        break;
      case 3:
        ctx.fillStyle = "#d8fcbf";
        ctx.fillRect(this.x * PLATE_SIZE, this.y * PLATE_SIZE, this.width, this.height);
      default:
        break;
    }
  }
}

document.addEventListener("DOMContentLoaded", setupCanvas);

function setupCanvas() {
  canvas = document.getElementById("maze");
  ctx = canvas.getContext("2d");
  canvas.width = PLATE_SIZE * MAZE_DIMENSION_X;
  canvas.height = PLATE_SIZE * MAZE_DIMENSION_Y;
  player = new Player(START_STATE_IDX);
  state.forEach((el, idx) => (maze[idx] = new Plate(idx)));
  document.addEventListener("keydown", pressButton);
  draw();
  qlearning();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  // debugger;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  maze.forEach(el => el.drawPlate());
  player.drawPlayer();
}

function pressButton(key) {
  switch (key.keyCode) {
    case 38:
      action = 0;
      break;
    case 40:
      action = 1;
      break;
    case 37:
      action = 2;
      break;
    case 39:
      action = 3;
      break;
    default:
      break;
  }
  movePlayer(action);
}

function movePlayer(action) {
  let reward;
  let nextState;
  let newX = player.x + ACTIONS[action].x;
  let newY = player.y + ACTIONS[action].y;

  // out of wall
  if (
    newX > MAZE_DIMENSION_X - 1 ||
    newX < 0 ||
    newY > MAZE_DIMENSION_Y - 1 ||
    newY < 0
  ) {
    nextState = getStateFromCoordinates(player.x, player.y);
    reward = -1;
  } else if (state[getStateFromCoordinates(newX, newY)] === 1) {
    nextState = getStateFromCoordinates(player.x, player.y);
    reward = R[getStateFromCoordinates(newX, newY)]
  } else {
    player.x = newX;
    player.y = newY;
    nextState = getStateFromCoordinates(newX, newY);
    reward = R[nextState];
  };

  if (getStateFromCoordinates(newX, newY) === END_STATE_IDX) isEnd = true;

  draw();
  return { nextState, reward }
}

// Learning

// Q table init
const Q = [];
for (let i = 0; i < MAZE_DIMENSION_X * MAZE_DIMENSION_Y; i++) {
  Q.push(Array(ACTIONS.length).fill(1.1))
}
for (let i=0; i < ACTIONS.length; i++) {
  Q[END_STATE_IDX][i] = 0;
}

// R table init
const R = Array(MAZE_DIMENSION_X * MAZE_DIMENSION_Y);
for (let i=0; i < R.length; i++) {
  if (state[i] === 0) R[i] = 0
  else if (state[i] === 1) R[i] = -1
}
R[END_STATE_IDX] = 100;

function getMaxQ(state) {
  let actionIdx = 0;
  for (let i=1; i < ACTIONS.length; i++) {
    if (Q[state][i] > Q[state][actionIdx]) {
      actionIdx = i;
    }
  }
  return Q[state][actionIdx]
}

function selectQAction(state) {
  let actionIdx = 0;
  for (let i=1; i < ACTIONS.length; i++) {
    if (Q[state][i] > Q[state][actionIdx]) {
      actionIdx = i;
    }
  }
  return actionIdx;
}

function selectRandomAction() {
  return Math.random() * ACTIONS.length << 0;
}

// parameters
const NUM_EPISODES = 10000
const MAX_STEPS_IN_EPISODE = 100
const LEARNING_RATE = 0.1
const DISCOUNT_RATE = 0.99
const MIN_EXPLORATION_RATE = 0.01
const MAX_EXPLORATION_RATE = 1
const EXPLORATION_DECAY_RATE = 0.01

let explorationRate = 1
let rewardsAllEpisodes = Array(NUM_EPISODES);

function qlearning() {
  for (let episode = 0; episode <= NUM_EPISODES; episode++) {
    let currentState = START_STATE_IDX;
    isEnd = false;
    let currentReward = 0;
    let stepCounter = 0;
    for (let step = 0; step <= MAX_STEPS_IN_EPISODE; step++) {
      let action;
      let explorationRateThreshold = Math.random();
      if (explorationRateThreshold > explorationRate) {
        action = selectQAction(currentState);
      } else {
        action = selectRandomAction();
      }
      let result = movePlayer(action);
      let newState = result.nextState;
      let reward = result.reward;
      Q[currentState][action] = Q[currentState][action] * (1 - LEARNING_RATE) + LEARNING_RATE * (reward + DISCOUNT_RATE * getMaxQ(newState));

      currentState = newState;
      currentReward += reward;
      stepCounter = step;
      if (isEnd) break;
    }
    explorationRate = MIN_EXPLORATION_RATE + (MAX_EXPLORATION_RATE - MIN_EXPLORATION_RATE) * Math.exp(-EXPLORATION_DECAY_RATE*episode)
    rewardsAllEpisodes.push(currentReward);
  }
  console.log(Q);
}