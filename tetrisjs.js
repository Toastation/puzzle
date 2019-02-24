const WIDTH = 900, HEIGHT = 600; // width and height of the screen
const W = 10; // width of the board
const H = 20; // height of the visible part of the board
const RH = 40; // real height of the board
const SH = 17; // spawn height
const BH = RH-H; // buffer height
const BS = 10; // block size in pixel
const W2 = W*BS; // width of the board in pixel 
const H2 = H*BS; // height of the board in pixel
const DASDELAY = 200; // delay after the first input is held, in ms
const INPUTDELAY = 25; // delay between inputs when a key is held, in ms
const GRAVITY = 500; // delay between the line falling, in ms
const LOCKDELAY = 1000; // delay between the block landing and locking in place, in ms
const MAXRESET = 10; // max number of lock delay reset with rotation/translation
const TYPES = ["T", "O", "I", "S", "Z", "J", "L"];

let data;
let board;
let fallInterval;
let queue = [], queueBuffer = [];
let hold = "";

let lastFall = -1;
let lastInput = -1;
let inputHeldCount = 0;
let landedTime = -1;
let resetCount = 0;
let score = 0;

let gameOver = false;
let pause = false;
let landed = false;
let canSwap = true;

let block = {
    x : 0,
    y : 0,
    type : "T",
    rot : 0
};

function getShape(type, rot) {
    return data[type].blocks[rot];
}

/**
 * INIT
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

function initGame() {
    queue = [];
    queueBuffer = [];
    hold = "";
    lastFall = -1;
    lastInput = -1;
    landedTime = -1;
    inputHeldCount = 0;
    resetCount = 0;
    gameOver = false;
    landed = false;
    canSwap = true;
    initBoard();
    initQueue();
    spawnNextBlock();
}

function initQueue() {
    queue = ["T", "O", "I", "S", "Z", "J", "L"];
    shuffle(queue, true);
}

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
}

/**
 *  RENDERING
 */

function drawBoard() {
    push();
    translate((WIDTH-W2)/2, (HEIGHT-H2)/2);
    stroke(255, 255, 255, 25);
    noStroke();
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
    translate((WIDTH-W2)/2, (HEIGHT-H2)/2);
    stroke(255, 255, 255, 25);
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
                rect((ox+x)*BS, (ghostY+y)*BS, BS, BS);
            }
        }
    }
    pop();
}

function drawBorders() {
    push();
    noFill();
    stroke(255,255,255);
    strokeJoin(BEVEL);
    rect((WIDTH-W2)/2-1, (HEIGHT-H2)/2-1, W2+1, H2+1);
    pop();
}

function drawPause() {
    push();
    fill(255, 255, 255);
    strokeWeight(2);
    stroke(0, 0, 0);
    textAlign(CENTER, CENTER);
    textSize(32);
    textFont();
    text("Paused", WIDTH/2, HEIGHT/2-H2/1.5);
    pop();
}

function drawGameOver() {
    push();
    fill(255, 255, 255);
    strokeWeight(2);
    stroke(0, 0, 0);
    textAlign(CENTER, CENTER);
    textSize(32);
    textFont();
    text("Game Over!", WIDTH/2, HEIGHT/2-H2/1.5);
    pop();
}

function drawDebug() {
    push();
    fill(255, 255, 255);
    strokeWeight(2);
    stroke(0, 0, 0);
    textAlign(CENTER, CENTER);
    textSize(12);
    textFont();
    text("hold = "+hold, 330, 400);
    text("resetCount = "+resetCount, 330, 425);
    pop();
}

function drawScore() {
    push();
    fill(255);
    strokeWeight(2);
    pop();
}

/**
 * GAME LOGIC
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

function lockAndCheck() {
    lock();
    checkClear(block.y, block.y+4);
    spawnNextBlock();
    resetCount = 0;
    landed = false;
    canSwap = true;
}

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

function getGroundY() {
    let y = block.y;
    while(!checkCollision(block.x, y+1, block.type, block.rot)) y += 1;
    return y;
}

function fall() {
    let ny = block.y+1;
    if (!checkCollision(block.x, ny, block.type, block.rot)) {
        block.y = ny;
        landed = checkCollision(block.x, block.y+1, block.type, block.rot);
        if (landed) landedTime = millis();
    } else {
        if (block.y == SH) gameOver = true;
    }
}

function hardDrop() {
    while(!checkCollision(block.x, block.y+1, block.type, block.rot)) block.y += 1;
    lockAndCheck();
}

function srsKickTest(clockwise, init, nrot) {
    let rot = clockwise ? "cw" : "ccw";
    let kick = block.type === "I" ? "kickI" : "kick";
    let tests = data[kick][init][rot];
    for (let i in tests) {
        if (!checkCollision(block.x+tests[i][0], block.y+tests[i][1], block.type, nrot)) {
            block.x += tests[i][0];
            block.y += tests[i][1];
            block.rot = nrot;
            landed = checkCollision(block.x, block.y+1, block.type, block.rot);
            return true;
        }
    }
    return false;
}

function checkClear() {
    let linesCleared = 0;
    let notCleared = false;
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
    if (linesCleared >= 1)
        console.log(linesCleared);
    return linesCleared;
}

function basicGravity(yMax) {
    for (let y=yMax; y>0; y--) {
        for (let x=0; x<W; x++) {
            board[x][y] = board[x][y-1];
        }
    }
}

function clearLine(y) {
    for (var x=0; x<W; x++) {
        board[x][y] = 0;
    }
}

function resetLockDelay() {
    if (landed) {
        if (resetCount == MAXRESET)
            lockAndCheck();
        resetCount++;
        landedTime = millis();
    }
}

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

function keyPressed() {
    if (!pause && !gameOver && keyCode == UP_ARROW) {
        hardDrop();
    }
    switch (key) {
        case "p":
            pause = !pause;
            break;
        case "w":
            let tmp = block.rot-1;
            if (tmp < 0) tmp = data[block.type].blocks.length-1;
            srsKickTest(false, block.rot, tmp);
            resetLockDelay();
            break;
        case "x":
            srsKickTest(true, block.rot, (block.rot+1)%4);
            resetLockDelay();
            break;
        case "r":
            initGame();
            break;
        case "c":
            swap();
            break;
    }
    if (keyCode == DOWN_ARROW) return false;
}

function keyReleased() {
    if (!pause && !gameOver)
        inputHeldCount = 0;
}

function input() {
    let t = millis();
    let inputDelay = (inputHeldCount === 1) ? DASDELAY : INPUTDELAY;
    if (lastInput > 0 && t - lastInput < inputDelay) return;
    if (keyIsDown(RIGHT_ARROW)) {
        if (!checkCollision(block.x+1, block.y, block.type, block.rot)) {
            block.x += 1;
            lastInput = t;
            inputHeldCount++;
            resetLockDelay();
        }
    } else if (keyIsDown(LEFT_ARROW)) {
        if (!checkCollision(block.x-1, block.y, block.type, block.rot)) {
            block.x -= 1;
            lastInput = t;
            inputHeldCount++;
            resetLockDelay();
        }
    } else if (keyIsDown(DOWN_ARROW)) {
        fall();
        lastInput = t;
    } else {
        inputHeldCount = 0;
    }
}

function update() {
    input();

    let t = millis();
    if (landed && t - landedTime > LOCKDELAY)
        lockAndCheck();
    
    if (t - lastFall > GRAVITY && !landed) { 
        fall();
        lastFall = t;
    }
}

/**
 * PROCESSING
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
}

function draw() {
    if (!pause && !gameOver) update();
    translate(-(WIDTH/2),-(HEIGHT/2));
    scale(2);
    background(0);
    drawBorders();
    drawBoard();
    drawBlock();
    if (pause) drawPause();
    if (gameOver) drawGameOver();
    drawDebug();
}
