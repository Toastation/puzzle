const WIDTH = 1024, HEIGHT = 800;
const W = 10;
const H = 20;
const BS = 10;
const W2 = W*BS;
const H2 = H*BS;
const TYPES = ["T", "O", "I", "S", "Z", "J", "L"];

let data;

let block = {
    x : 0,
    y : 0,
    type : "T",
    rot : 0
};

let board;
let fallInterval;
let pause = false;

function initBoard() {
    board = new Array(W);
    for (let w=0; w<W; w++) {
        board[w] = new Array(H);
        for (let h=0; h<H; h++) {
            board[w][h]=0;
        }
    }
}

function initGame() {
    initBoard();
    spawnNextBlock();
}

function getShape(type, rot) {
    return data[type].blocks[rot];
}

function drawBoard() {
    push();
    translate((WIDTH-W2)/2, (HEIGHT-H2)/2);
    stroke(255, 255, 255, 25);
    strokeWeight(1);
    for (let x=0; x<W; x++) {
        push();
        noStroke();
        x % 2 == 0 ? fill(255, 253, 208) : fill(210, 180, 140);
        rect(x*BS, 0, BS+1, H2+1);
        pop();
        for (let y=0; y<H; y++) {
            noFill();
            rect(x*BS, y*BS, BS, BS);
            fill(200, 0, 0);
            if (board[x][y] === 1)
                rect(x*BS, y*BS, BS, BS);
        }    
    }
    pop();
}

function drawBlock() {
    push();
    translate((WIDTH-W2)/2, (HEIGHT-H2)/2);
    stroke(255, 255, 255, 25);
    strokeWeight(1);
    let color = data[block.type].color;
    fill(color[0], color[1], color[2]);
    let shape = getShape(block.type, block.rot);
    let ox = block.x, oy = block.y;
    for (let x=0; x<shape.length; x++) {
        for (let y=0; y<shape.length; y++) {
            if (oy+y < 0) continue;
            if (shape[y][x] === 1)
                rect((ox+x)*BS, (oy+y)*BS, BS, BS);
        }
    }
    pop();
}

function drawBorders() {
    push();
    noFill();
    stroke(255,255,255);
    strokeJoin(BEVEL);
    rect((WIDTH-W2)/2-1, (HEIGHT-H2)/2-1, W2+2, H2+2);
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
    text("Paused", WIDTH/2, HEIGHT/2);
    pop();
}

function spawnNextBlock() {
    block.type = random(TYPES);
    block.rot = 0;
    block.x = 5;
    block.y = -3;
}

function getHighestEmptyY(x, oy) {
    for (let y = oy; y<H; y++) {
        if (y+1 >= H || board[x][y+1] === 1)
            return y;
    }
    return oy;
}

function land() {
    let shape = getShape(block.type, block.rot);
    for (let x = 0; x<shape.length; x++) {
        for (let y = 0; y<shape.length; y++) {
            if (shape[y][x] === 1)
                board[x+block.x][y+block.y] = shape[y][x];
        }
    }
    return true;
}

function checkCollision(ox, oy, type, rot) {
    let shape = getShape(type, rot);
    for (let x=0; x<shape.length; x++) {
        for (let y=shape.length-1; y>=0; y--) {
            if (shape[y][x] === 1 && (ox+x >= W || oy+y >= H || ox+x < 0 || board[ox+x][oy+y] === 1))
                    return true;
        }
    }
    return false;
}

function fall() {
    let ny = block.y+1;
    if (checkCollision(block.x, ny, block.type, block.rot)) {
        land();
        checkClear(block.y, block.y+4);
        spawnNextBlock();
    } else {
        block.y = ny;
    }
}

function quickFall() {
    while(!checkCollision(block.x, block.y+1, block.type, block.rot))
        block.y += 1;
    land();
    checkClear(block.y, block.y+4);
    spawnNextBlock();
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
            return true;
        }
    }
    return false;
}

function checkClear(y1, y2) {
    let linesCleared = 0;
    let notCleared = false;
    for (let y=0; y<H; y++) {
        for (let x=0; x<W; x++) {
            if (board[x][y] === 0) {
                notCleared = true;
                break;
            }
        }
        if (!notCleared) {
            clearLine(y);
            blockFall(y);
            linesCleared += 1;
        }
        notCleared = false;
    }
    if (linesCleared >= 1)
        console.log(linesCleared);
    return linesCleared;
}

function blockFall(yMax) {
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

function keyPressed() {
    if (!pause) {
        switch (keyCode) {
            case LEFT_ARROW:
                if (!checkCollision(block.x-1, block.y, block.type, block.rot)) block.x -= 1;
                break;
            case RIGHT_ARROW:
                if (!checkCollision(block.x+1, block.y, block.type, block.rot)) block.x += 1;
                break;
            case DOWN_ARROW:
                fall();
                break;
            case UP_ARROW:
                quickFall();
                break;
        } 
    }
    switch (key) {
        case "P":
            pause = !pause;
            if (pause) {
                clearInterval(fallInterval);
            } else {
                fallInterval = setInterval(fall, 500);
            }
            break;
        case "W":
            let tmp = block.rot-1;
            if (tmp < 0) tmp = data[block.type].blocks.length-1;
            srsKickTest(false, block.rot, tmp);
            break;
        case "X":
            srsKickTest(true, block.rot, (block.rot+1)%4);
            break;
    }
}

function update() {
    if (keyIsDown(DOWN_ARROW))
        fall();
}

function preload() {
    data = loadJSON("data.json", ()=>{
        console.log("data successfully loaded");
    }, ()=>{
        console.err("cannot load data");
    });
}

function setup() {
    createCanvas(WIDTH,HEIGHT);
    initGame();
    fallInterval = setInterval(fall, 500);
}

function draw() {
    // if (!pause) update()
    translate(-(WIDTH/2),-(HEIGHT/2));
    scale(2);
    background(0);
    drawBorders();
    drawBoard();
    drawBlock();
    if (pause) drawPause();
}
