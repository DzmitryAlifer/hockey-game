export const PI = Math.PI;
export const PUCK_RADIUS = 4;
export const RINK_WIDTH = 400;
export const RINK_LENGTH = RINK_WIDTH * 2.215;
export const PUCK_MAX_SPEED = 200;

let isBoardMet = false;

export function drawPuck(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(0, 0, PUCK_RADIUS, 0, PI * 2);
    ctx.fillStyle = '#444';
    ctx.fill();
}

export function getBoardBounce(x: number, y: number): 'x' | 'y' | null {
    const isNearYBoard = x <= PUCK_RADIUS || x >= RINK_LENGTH - PUCK_RADIUS;
    const isNearXBoard = y <= PUCK_RADIUS || y >= RINK_WIDTH - PUCK_RADIUS;
    const isNearBoard = isNearXBoard || isNearYBoard;

    if (isNearBoard && !isBoardMet) {
        isBoardMet = true;
    } else {
        isBoardMet = false;
    }

    if (!isBoardMet) return null;
    return isNearXBoard ? 'x' : 'y';
}

export function calculatePuckShift(speed: number, angle: number): [number, number] {
    return [Math.cos(angle) * speed / 10, Math.sin(angle) * speed / 10];
}

export function getRandomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}