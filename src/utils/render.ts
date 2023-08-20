export const PI = Math.PI;
export const PUCK_RADIUS = 4;
export const RINK_WIDTH = 400;
export const RINK_LENGTH = RINK_WIDTH * 2.22;
export const PUCK_MAX_SPEED = 200;

export function drawPuck(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(0, 0, PUCK_RADIUS, 0, PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
}

export function isOutsideField(x: number, y: number): boolean {
    return x <= 1.5 * PUCK_RADIUS || 
        x >= RINK_LENGTH - 1.5 * PUCK_RADIUS ||
        y <= 1.5 * PUCK_RADIUS ||
        y >= RINK_WIDTH - 1.5 * PUCK_RADIUS;
}

export function calculatePuckShift(speed: number, angle: number): [number, number] {
    return [Math.cos(angle) * speed / 10, Math.sin(angle) * speed / 10];
}

export function getRandomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}