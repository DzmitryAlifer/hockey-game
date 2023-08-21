export const PI = Math.PI;
export const PUCK_RADIUS_PX = 4;
export const PUCK_CLEANUP_RADIUS_PX = PUCK_RADIUS_PX + 2;
export const RINK_WIDTH_PX = 400;
export const CORNER_45_DEG_SIZE_PX = 65;
export const RINK_LENGTH_PX = RINK_WIDTH_PX * 2.215;
export const PUCK_MAX_SPEED = 200;
export const PUCK_BOUNCE_MIN_SPEED_DECREASE = 5;
export const PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE = 50;
export const PUCK_SPEED_DECREASE_RATIO = 0.05;

let isBoardMet = false;

export function drawPuck(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(0, 0, PUCK_RADIUS_PX, 0, PI * 2);
    ctx.fillStyle = '#444';
    ctx.fill();
}

export function getBoardBounce(x: number, y: number): 'x' | 'y' | null {
    const isNearYBoard = x <= PUCK_RADIUS_PX || x >= RINK_LENGTH_PX - PUCK_RADIUS_PX;
    const isNearXBoard = y <= PUCK_RADIUS_PX || y >= RINK_WIDTH_PX - PUCK_RADIUS_PX;
    const isNearBoard = isNearXBoard || isNearYBoard;
    isBoardMet = isNearBoard && !isBoardMet;

    if (!isBoardMet) return null;

    return isNearXBoard ? 'x' : 'y';
}

export function calculatePuckShift(speed: number, angle: number): [number, number] {
    return [Math.cos(angle) * speed / 10, Math.sin(angle) * speed / 10];
}

export function getRandomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}