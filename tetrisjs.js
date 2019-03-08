const WIDTH = 900, HEIGHT = 600; // width and height of the screen
const W = 10; // width of the board
const H = 20; // height of the visible part of the board
const RH = 40; // real height of the board
const SH = 17; // spawn height
const BH = RH-H; // buffer height
const BS = 10; // block size in pixel
const W2 = W*BS; // width of the board in pixel 
const H2 = H*BS; // height of the board in pixel
const SCALE = 2.0; // vertical and horizontal scaling
const DASDELAY = 200; // delay after the first input is held, in ms
const INPUTDELAY = 25; // delay between inputs when a key is held, in ms
var gravity = 500; // delay between the line falling, in ms
var gravityMax = 1000;
var gravityMin = 1;
const LOCKDELAY = 1000; // delay between the block landing and locking in place, in ms
const MAXRESET = 10; // max number of lock delay reset with rotation/translation
const TYPES = ["T", "O", "I", "S", "Z", "J", "L"];
const MOVES = {
    NONE : "NONE",
    MOVEL : "MOVEL",
    MOVER : "MOVER",
    ROT : "ROT",
    ROTTST : "ROTTST" 
};
const SPINS = {
    NO_SPIN : "",
    T_SPIN : "T-SPIN",
    T_SPIN_MINI : "T-SPIN MINI"
};
const CLEAR = {
    0 : "",
    1 : "SINGLE",
    2 : "DOUBLE",
    3 : "TRIPLE",
    4 : "TETRIS"
}

let data;
let board;
let fallInterval;
let queue = [], queueBuffer = [];
let hold = "";
let lastRegisteredMove = MOVES.NONE;

let lastFall = -1;
let lastInput = -1;
let inputHeldCount = 0;
let landedTime = -1;
let resetCount = 0;
let score = 0;

let gameOver = false;
let pause = false;
let debug = true;
let landed = false;
let canSwap = true;

let gui;

let block = {
    x : 0,
    y : 0,
    type : "T",
    rot : 0
};

/**
 * Returns the block matrix of the given type and rotation
 */
function getShape(type, rot) {
    return data[type].blocks[rot];
}

/**
 * INIT
 */

 /**
  * Initializes the empty board
  */
function initBoard() {
    board = new Array(W);
    for (let w=0; w<W; w++) {
        board[w] = new Array(H);
        for (let h=0; h<RH; h++) {
            board[w][h]=0;
        }
    }
}

/**
 * Initializes the default parameters
 */
function initGame() {
    queue = [];
    queueBuffer = [];
    hold = "";
    lastRegisteredMove = MOVES.NONE;
    lastFall = -1;
    lastInput = -1;
    landedTime = -1;
    inputHeldCount = 0;
    resetCount = 0;
    score = 0;
    gameOver = false;
    landed = false;
    canSwap = true;
    initBoard();
    initQueue();
    spawnNextBlock();
}

/**
 * Initializes the block queue
 */
function initQueue() {
    queue = ["T", "O", "I", "S", "Z", "J", "L"];
    shuffle(queue, true);
}

/**
 * Pops the head of the block queue and set it as the new block.
 * Pops the head of the buffer and add it to the block queue.
 * Refills and shuffles the buffer if it empty.
 */
function spawnNextBlock() {
    if (queueBuffer.length == 0) {
        queueBuffer = ["T", "O", "I", "S", "Z", "J", "L"];
        shuffle(queueBuffer, true);
    }
    let nextType = queue.shift();
    queue.push(queueBuffer.pop());
    block.x = 3;
    block.y = SH;
    block.type = nextType;
    block.rot = 0;
    lastRegisteredMove = MOVES.NONE;
}

/**
 *  RENDERING
 */

function drawBoard() {
    push();
    noFill();
    stroke(255,255,255);
    strokeJoin(BEVEL);
    rect(0, 0, W2+1, H2+1);
    noStroke();
    translate(1, 1); // border
    for (let x=0; x<W; x++) {
        push();
        noStroke();
        x % 2 == 0 ? fill(0, 0, 0, 0) : fill(40, 40, 40, 75);
        rect(x*BS, 0, BS, H2);
        pop();
        for (let y=0; y<H; y++) {
            noFill();
            rect(x*BS, y*BS, BS, BS);
            if (board[x][y+BH] >= 1) {
                let color = data.colors[board[x][y+BH]-1];
                fill(color[0], color[1], color[2]);
                rect(x*BS, y*BS, BS, BS);
            }
        }    
    }
    pop();
}

function drawBlock() {
    push();
    translate(1, 1); // border
    noStroke();
    let color = data.colors[data[block.type].color-1];
    let shape = getShape(block.type, block.rot);
    let ox = block.x, oy = block.y-20;
    let ghostY = getGroundY()-20;
    for (let x=0; x<shape.length; x++) {
        for (let y=0; y<shape.length; y++) {
            if (shape[y][x] >= 1) {
                fill(color[0], color[1], color[2]);
                if (oy+y>=0) rect((ox+x)*BS, (oy+y)*BS, BS, BS);
                fill(color[0], color[1], color[2], 30);
                if (ghostY+y>=0) rect((ox+x)*BS, (ghostY+y)*BS, BS, BS);
            }
        }
    }
    pop();
}

function drawPause() {
    push();
    fill(255, 255, 255);
    strokeWeight(2);
    stroke(0, 0, 0);
    translate(WIDTH / (2 * SCALE), HEIGHT / (2 * SCALE));
    textAlign(CENTER, CENTER);
    textSize(32);
    text("Paused", 0, 0);
    pop();
}

function drawGameOver() {
    push();
    fill(255, 255, 255);
    strokeWeight(2);
    stroke(0, 0, 0);
    translate(WIDTH / (2 * SCALE), HEIGHT / (2 * SCALE));
    textAlign(CENTER, CENTER);
    textSize(32);
    text("Game Over!", 0, -(H2/2) - 32);
    pop();
}

function drawScore() {
    push();
    translate((WIDTH/2 - W2*SCALE/2) / SCALE + W2 + 10, (HEIGHT/2 - H2*SCALE/2) / SCALE + 110);
    stroke(255);
    strokeWeight(1);
    fill(0);
    rect(0, 0, 50, 50);
    textSize(10);
    strokeWeight(0);
    fill(255);
    text("Score", 12, 10);
    text(""+score, 5+20-textWidth(""+score)/2, 30);
    pop();
}

function drawNext() {
    push();
    translate((WIDTH/2 - W2*SCALE/2) / SCALE + W2 + 10, (HEIGHT/2 - H2*SCALE/2) / SCALE);
    stroke(255);
    strokeWeight(1);
    fill(0);
    rect(0, 0, 50, 100);
    for (let i = 0; i < 3; i++) {
        noStroke();
        let color = data.colors[data[queue[i]].color-1];
        let shape = getShape(queue[i], 0);
        let ox = 1, oy = 1+i*3;
        let offset = queue[i] === "I" ? -(BS/2) : 0; 
        //let size = shape.length <= 3 ? shape.length : 3;
        for (let x=0; x<shape.length; x++) {
            for (let y=0; y<shape.length; y++) {
                if (shape[y][x] >= 1) {
                    fill(color[0], color[1], color[2]);
                    if (oy+y>=0) rect((ox+x)*BS+offset, (oy+y)*BS+offset, BS, BS);
                }
            }
        }
    }
    pop();
}

function drawHold() {
    push();
    translate((WIDTH/2 - W2*SCALE/2) / SCALE - 60, (HEIGHT/2 - H2*SCALE/2) / SCALE);
    stroke(255);
    strokeWeight(1);
    fill(0);
    rect(0, 0, 50, 40);
    noStroke();
    if (hold != "") {
        let color = data.colors[data[hold].color-1];
        let shape = getShape(hold, 0);
        let ox = 1, oy = 1;
        let offset = hold === "I" ? -(BS/2) : 0; 
        for (let x=0; x<shape.length; x++) {
            for (let y=0; y<shape.length; y++) {
                if (shape[y][x] >= 1) {
                    fill(color[0], color[1], color[2]);
                    if (oy+y>=0) rect((ox+x)*BS+offset, (oy+y)*BS+offset, BS, BS);
                }
            }
        }
    }
    pop();
}

function drawDebug() {
    push(); 
    fill(255, 255, 255);
    strokeWeight(2);
    stroke(0, 0, 0);
    textSize(10);
    text("hold = "+hold, 5, 50);
    text("resetCount = "+resetCount, 5, 65);
    text("landed = "+landed, 5, 80);
    text("resets = "+resetCount, 5, 95);
    text("lastMove = "+lastRegisteredMove, 5, 110);
    pop();
}

/**************
 * GAME LOGIC *
 **************/

/**
 * Lock the block into the board 
 */
function lock() {
    let shape = getShape(block.type, block.rot);
    for (let x = 0; x<shape.length; x++) {
        for (let y = 0; y<shape.length; y++) {
            if (shape[y][x] >= 1)
                board[x+block.x][y+block.y] = shape[y][x]*data[block.type].color;
        }
    }
    return true;
}

/**
 * Lock the block into the board and checks if lines can be cleared 
 */
function lockAndCheck() {
    lock();
    checkClear(block.y, block.y+4);
    spawnNextBlock();
    resetCount = 0;
    landed = false;
    canSwap = true;
}

/**
 * Returns true if the given block type, position and rotation are colliding with pieces on the board
 */
function checkCollision(ox, oy, type, rot) {
    let shape = getShape(type, rot);
    for (let x=0; x<shape.length; x++) {
        for (let y=shape.length-1; y>=0; y--) {
            if (shape[y][x] >= 1 && (ox+x >= W || oy+y >= RH || ox+x < 0 || board[ox+x][oy+y] >= 1))
                    return true;
        }
    }
    return false;
}

/**
 * Returns the y coordinate of the block if we were to hard drop it (the projection on the ground)
 */
function getGroundY() {
    let y = block.y;
    while(!checkCollision(block.x, y+1, block.type, block.rot)) y += 1;
    return y;
}

/**
 * Check if the block is on the ground, if so it changes the landed flag
 */
function hasLanded() {
    if (checkCollision(block.x, block.y+1, block.type, block.rot)) {
        landed = true;
        landedTime = millis();
    } else {
        landed = false;
    }
}

/**
 * Makes the block fall one line down if possible
 */
function fall() {
    let ny = block.y+1;
    if (!checkCollision(block.x, ny, block.type, block.rot)) {
        block.y = ny;
        hasLanded();
    } else {
        if (block.y == SH) gameOver = true;
        landed = true;
        landedTime = millis();
    }
}

/**
 * Makes the block fall instantly to the ground
 */
function hardDrop() {
    while(!checkCollision(block.x, block.y+1, block.type, block.rot)) block.y += 1;
    lockAndCheck();
}

/**
 * Checks if some lines can be cleared and update the score
 */
function checkClear() {
    let linesCleared = 0;
    let notCleared = false;
    let spin = isTSpin();
    for (let y=0; y<H; y++) {
        for (let x=0; x<W; x++) {
            if (board[x][y+BH] === 0) {
                notCleared = true;
                break;
            }
        }
        if (!notCleared) {
            clearLine(y+BH);
            basicGravity(y+BH);
            linesCleared += 1;
        }
        notCleared = false;
    }
    score += getPoints(linesCleared, spin);
    return linesCleared;
}
 /**
  * Clears the given line 
  */
function clearLine(y) {
    for (var x=0; x<W; x++) {
        board[x][y] = 0;
    }
}

/**
 * Makes all lines above yMax fall one line down 
 */
function basicGravity(yMax) {
    for (let y=yMax; y>0; y--) {
        for (let x=0; x<W; x++) {
            board[x][y] = board[x][y-1];
        }
    }
}

/**
 * Returns whether the last rotation was a (mini) T-spin or not
 * T-spin rules :
 *      is a T piece
 *      last move was a rot
 *      3 corners blocked
 * T-spin mini rules :
 *      empty block adjacent to the point
 *      "behind" block blocked
 *      not a mini if the twist was from a T-spin triple twist
 */
function isTSpin() {
    if (block.type != "T" || (lastRegisteredMove != MOVES.ROT && lastRegisteredMove != MOVES.ROTTST)) return SPINS.NO_SPIN;
    let corners = [[0, 0], [0, 2], [2, 0], [2, 2]];
    let points = [[1, 0], [2, 1], [1, 2], [0, 1]];
    let behinds = [[1, 2], [0, 1], [1, 0], [2, 1]];
    let cornersBlocked = 0;
    let adjacentToPointBlocked = 0;
    let point = points[block.rot];
    let behind = behinds[block.rot];
    let behindBlocked = false;
    for (const corner of corners) {
        let x = block.x + corner[0];
        let y = block.y + corner[1];
        if (x >= W || x < 0 || y < 0) continue;
        if (y >= RH || board[x][y] >= 1) {
            cornersBlocked++;
            if (point[0] == x || point[1] == y)
                adjacentToPointBlocked++;
        }
    }
    let x = block.x + behind[0], y = block.y + behind[1];
    if (x >= 0 && x < H && y >= 0)
        behindBlocked = board[x][y] >= 1 || y >= RH;
    console.log("cornersBlocked = "+cornersBlocked);
    console.log("adjacentToPointBlocked = "+adjacentToPointBlocked);
    console.log("behindBlocked = "+behindBlocked);
    console.log("--------------");
    if (cornersBlocked >= 3) {
        if (adjacentToPointBlocked === 1 || behindBlocked === true) {
            if (lastRegisteredMove === MOVES.ROTTST) return SPINS.T_SPIN;
            else return SPINS.T_SPIN_MINI;
        }
        return SPINS.T_SPIN;
    }
    return SPINS.NO_SPIN;
}

/**
 * Returns the amount of points from the last lines cleared
 */
function getPoints(linesCleared, spin) {
    let points = 0;
    if (linesCleared <= 0 || linesCleared >= 5) return 0;
    if (spin === SPINS.NO_SPIN) points = data["scores"][linesCleared-1];
    else if (spin === SPINS.T_SPIN_MINI) points = data["scores"][4+linesCleared];
    else if (spin === SPINS.T_SPIN) points = data["scores"][6+linesCleared];
    console.log(spin+" "+CLEAR[linesCleared])
    return points;
}

/**
 * Resets the lock delay (from a rotation or move)
 */
function resetLockDelay() {
    if (landed) {
        if (resetCount < MAXRESET) {
            resetCount++;
            landedTime = millis();
        }
    }
}

/**
 * Swaps the current blocks with the currently held block
 */
function swap() {
    if (!canSwap) return;
    let buf = block.type;
    if (hold === "") {
        spawnNextBlock();
        hold = buf;
    } else {
        block.type = hold;
        hold = buf;
    }
    canSwap = false;
}

/**
 * Performs a rotation according to the SRS guideline
 * Returns true if the rotation was successful 
 */
function srsKickTest(clockwise, init, nrot) {
    let rot = clockwise ? "cw" : "ccw";
    let kick = block.type === "I" ? "kickI" : "kick";
    let tests = data[kick][init][rot];
    for (let i in tests) {
        if (!checkCollision(block.x+tests[i][0], block.y+tests[i][1], block.type, nrot)) {
            lastRegisteredMove = block.type === "T" && rot === "cw" && (rot === 0 || rot === 2) && i === tests.length-1 ? MOVES.ROTTST : MOVES.ROT; // last kick of 0->1 or 2->3 is successful
            block.x += tests[i][0];
            block.y += tests[i][1];
            block.rot = nrot;
            hasLanded();
            return true;
        }
    }
    return false;
}

/**
 * keyPressed function override
 */
function keyPressed() {
    if (!pause && !gameOver && keyCode == UP_ARROW) {
        hardDrop();
    }
    switch (key) {
        case "p": case "P":
            pause = !pause;
            break;
        case "w": case "W":
            let tmp = block.rot-1;
            if (tmp < 0) tmp = data[block.type].blocks.length-1;
            srsKickTest(false, block.rot, tmp);
            resetLockDelay();
            break;
        case "x": case "X":
            srsKickTest(true, block.rot, (block.rot+1)%4);
            resetLockDelay();
            break;
        case "r": case "R":
            initGame();
            break;
        case "c": case "C":
            swap();
            break;
        case "d": case "D":
            debug = !debug;
            break;
    }
    if (keyCode == DOWN_ARROW) return false;
}

/**
 * keyReleased function override
 */
function keyReleased() {
    if (!pause && !gameOver)
        inputHeldCount = 0;
}

/**
 * Handles movement inputs
 */
function movementInputs() {
    let t = millis();
    let inputDelay = (inputHeldCount === 1) ? DASDELAY : INPUTDELAY;
    if (lastInput > 0 && t - lastInput < inputDelay) return;
    if (keyIsDown(RIGHT_ARROW)) {
        if (!checkCollision(block.x+1, block.y, block.type, block.rot)) {
            block.x += 1;
            lastInput = t;
            inputHeldCount++;
            lastRegisteredMove = MOVES.MOVER;
            resetLockDelay();
            hasLanded();
        }
    } else if (keyIsDown(LEFT_ARROW)) {
        if (!checkCollision(block.x-1, block.y, block.type, block.rot)) {
            block.x -= 1;
            lastInput = t;
            inputHeldCount++;
            lastRegisteredMove = MOVES.MOVEL;
            resetLockDelay();
            hasLanded();
        }
    } else if (keyIsDown(DOWN_ARROW)) {
        fall();
        lastInput = t;
    } else {
        inputHeldCount = 0;
    }
}

/**
 * Updates the game (gravity, lock delay)
 */
function update() {
    movementInputs();
    let t = millis();
    if (landed && t - landedTime > LOCKDELAY)
        lockAndCheck();
    
    if (t - lastFall > gravity && !landed) { 
        fall();
        lastFall = t;
    }
}

/**
 * PROCESSING FUNCTIONS
 */

function preload() {
    data = loadJSON("data.json", ()=>{
        console.log("data successfully loaded");
    }, ()=>{
        console.err("cannot load data");
    });
}

function setup() {
    let canvas = createCanvas(WIDTH, HEIGHT);
    canvas.parent("sketch");
    initGame();
    lastFall = millis();
    gui = createGui('Settings');
    gui.addGlobals("gravity");
}

function draw() {
    if (!focused) pause = true;
    if (!pause && !gameOver) update();
    scale(SCALE);
    background(0);
    push();
    translate((WIDTH/2 - W2*SCALE/2) / SCALE, (HEIGHT/2 - H2*SCALE/2) / SCALE);
    drawBoard();
    drawBlock();
    pop();
    drawNext();
    drawHold();
    drawScore();
    if (pause) drawPause();
    if (gameOver) drawGameOver();
    if (debug) drawDebug();
}
