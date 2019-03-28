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
            lastTime = millis();
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
}

/**
 * keyReleased function override
 */
function keyReleased() {
    if (!pause && !gameOver)
        inputHeldCount = 0;
}

/**
 * Handles held down keys
 */
function keyDown() {
    let t = millis();
    let delay = (inputHeldCount === 1) ? DAS : ARR;
    if (lastInput > 0 && t - lastInput < delay) return;
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