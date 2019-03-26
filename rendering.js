/**
 * Draw the background and edges of the canvas
 */
function drawBorder() {
    background(0);
    stroke(255);
    strokeWeight(2);
    fill(0, 0, 0, 0);
    rect(0, 0, WIDTH, HEIGHT);
}

/**
 * Draw the game board and its borders (does not contains the actual falling piece)
 */
function drawBoard() {
    push();
    noFill();
    stroke(255,255,255);
    strokeJoin(BEVEL);
    rect(0, 0, W2+2, H2+2);
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

/**
 * Draw the current falling piece
 */
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

/**
 * Draw the pause menu
 */
function drawPause() {
    push();
    fill(255, 255, 255);
    strokeWeight(2);
    stroke(0, 0, 0);
    translate(WIDTH / (2 * scaling), HEIGHT / (2 * scaling));
    textAlign(CENTER, CENTER);
    textSize(32);
    text("Paused", 0, 0);
    pop();
}

/**
 * Draw the game over menu
 */
function drawGameOver() {
    push();
    fill(255, 255, 255);
    strokeWeight(2);
    stroke(0, 0, 0);
    translate(WIDTH / (2 * scaling), HEIGHT / (2 * scaling));
    textAlign(CENTER, CENTER);
    textSize(32);
    text("Game Over!", 0, -(H2/2) - 32);
    pop();
}

/**
 * Draw the next pieces UI
 */
function drawNext() {
    push();
    translate((WIDTH/2 - W2*scaling/2) / scaling + W2 + 10, (HEIGHT/2 - H2*scaling/2) / scaling);
    strokeWeight(0);
    textSize(10);
    fill(255);
    text("Next", 25-textWidth("Next")/2, -3);
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

/**
 * Draw the held piece UI
 */
function drawHold() {
    push();
    translate((WIDTH/2 - W2*scaling/2) / scaling - 60, (HEIGHT/2 - H2*scaling/2) / scaling);
    strokeWeight(0);
    textSize(10);
    fill(255);
    text("Hold", 25-textWidth("Hold")/2, -4);
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

/**
 * Draw the score and time (info UI)
 */
function drawInfos() {
    push();
    translate((WIDTH/2 - W2*scaling/2) / scaling - 60, (HEIGHT/2 - H2*scaling/2) / scaling + 50);
    stroke(255);
    strokeWeight(1);
    fill(0);
    rect(0, 0, 50, 40);
    strokeWeight(0);
    textSize(8);
    fill(255);
    text("Score: "+score, 5+20-textWidth("Score: "+score)/2, 10);
    text("Lines: "+totLinesCleared, 25-textWidth("Lines: "+totLinesCleared)/2, 20);
    let min = round((Math.floor((timeCount/1000/60))));
    let sec = round((Math.floor((timeCount/1000)%60)));
    let mil = round(timeCount % 1000);
    text(min+"\'"+sec+"\""+mil, 25-textWidth(min+"\'"+sec+"\""+mil)/2, 30);
    pop();
}

/**
 * Draw the debug parameters
 */
function drawDebug() {
    push(); 
    fill(255, 255, 255);
    strokeWeight(2);
    stroke(0, 0, 0);
    textSize(10);
    text("hold = "+hold, 5, 50);
    text("landedTime = "+landedTime, 5, 65);
    text("landed = "+landed, 5, 80);
    text("resets = "+resetCount, 5, 95);
    text("lastMove = "+lastRegisteredMove, 5, 110);
    text("comboCounter = "+comboCounter, 5, 125);
    pop();
}