export const PI = Math.PI;
export const FACE_OFF_SPOT_RADIUS = 6;
export const PUCK_RADIUS = 3;
export const RINK_WIDTH = 400;
export const RINK_LENGTH = RINK_WIDTH * 2.25;

export function drawPuck(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(0, 0, PUCK_RADIUS, 0, PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
}

export function isOutsideField(x: number, y: number): boolean {
    return x <= PUCK_RADIUS || 
        x >= RINK_LENGTH - PUCK_RADIUS ||
        y <= PUCK_RADIUS ||
        y >= RINK_WIDTH - PUCK_RADIUS;
}