export const PI = Math.PI;
export const PUCK_RADIUS_PX = 4;
export const PUCK_CLEANUP_RADIUS_PX = PUCK_RADIUS_PX + 2;
export const RINK_WIDTH_PX = 400;
export const CORNER_SEGMENT_SIZE_PX = 60;
export const RINK_LENGTH_PX = RINK_WIDTH_PX * 2.215;
export const PUCK_MAX_SPEED = 200;
export const PUCK_BOUNCE_MIN_SPEED_DECREASE = 5;
export const PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE = 50;
export const PUCK_SPEED_DECREASE_RATIO = 0.05;

export interface PuckShot {
    puckX: number;
    puckY: number;
    speed: number;
    angle: number;
}

export enum BoardPart {
    Left,
    Top,
    Right,
    Bottom,
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
}

let isBoardMet = false;

export function drawPuck(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(0, 0, PUCK_RADIUS_PX, 0, PI * 2);
    ctx.fillStyle = '#444';
    ctx.fill();
}

function getBoardPart({ puckX, puckY, angle }: PuckShot): BoardPart {
    if (angle > 0 && angle <= PI / 2) {
        const rightBoardDist = RINK_LENGTH_PX - puckX;
        const bottomBoardDist = RINK_WIDTH_PX - puckY;

        if (Math.sin(angle) * rightBoardDist < bottomBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Right;
        } else if (Math.sin(PI / 2 - angle) * bottomBoardDist < rightBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Bottom;
        } else {
            return BoardPart.BottomRight;
        }
    }

    if (angle > PI / 2 && angle <= PI) {
        const bottomBoardDist = RINK_WIDTH_PX - puckY;
        const leftBoardDist = puckX;

        if (Math.sin(angle) * bottomBoardDist < leftBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Right;
        } else if (Math.sin(PI / 2 - angle) * leftBoardDist < bottomBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Bottom;
        } else {
            return BoardPart.BottomRight;
        }
    }

    if (angle > PI && angle <= 3 * PI / 2) {
        const leftBoardDist = puckX;
        const topBoardDist = RINK_WIDTH_PX - puckY;

        if (Math.sin(angle) * leftBoardDist < topBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Right;
        } else if (Math.sin(PI / 2 - angle) * topBoardDist < leftBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Bottom;
        } else {
            return BoardPart.BottomRight;
        }
    }

    const topBoardDist = RINK_WIDTH_PX - puckY;
    const rightBoardDist = RINK_LENGTH_PX - puckX;

    if (Math.sin(angle) * topBoardDist < rightBoardDist - CORNER_SEGMENT_SIZE_PX) {
        return BoardPart.Right;
    } else if (Math.sin(PI / 2 - angle) * rightBoardDist < topBoardDist - CORNER_SEGMENT_SIZE_PX) {
        return BoardPart.Bottom;
    } else {
        return BoardPart.BottomRight;
    }
}

export function getBoardBounce(x: number, y: number, angle?: number): 'x' | 'y' | null {
    const isNearYBoard = x <= PUCK_RADIUS_PX || x >= RINK_LENGTH_PX - PUCK_RADIUS_PX;
    const isNearXBoard = y <= PUCK_RADIUS_PX || y >= RINK_WIDTH_PX - PUCK_RADIUS_PX;
    const isNearBoard = isNearXBoard || isNearYBoard;
    isBoardMet = isNearBoard && !isBoardMet;

    if (!isBoardMet) return null;

    return isNearXBoard ? 'x' : 'y';
}

export function getBoardBounce2(puckShot: PuckShot): BoardPart | null {
    const targetBoardPart = getBoardPart(puckShot);
    const { puckX, puckY } = puckShot;
    let isNearBoard = false;

    switch (targetBoardPart) {
        case BoardPart.Right:
            isNearBoard = puckX >= RINK_LENGTH_PX - PUCK_RADIUS_PX;
            break;
        case BoardPart.Bottom:
            isNearBoard = puckY >= RINK_WIDTH_PX - PUCK_RADIUS_PX;
            break;
        case BoardPart.Left:
            isNearBoard = puckX <= PUCK_RADIUS_PX;
            break;
        case BoardPart.Top:
            isNearBoard = puckY <= PUCK_RADIUS_PX;
            break;
        case BoardPart.BottomRight:
            isNearBoard = getSegmentDist(puckX, puckY, RINK_LENGTH_PX, RINK_WIDTH_PX - CORNER_SEGMENT_SIZE_PX, RINK_LENGTH_PX - CORNER_SEGMENT_SIZE_PX, RINK_WIDTH_PX) <= PUCK_RADIUS_PX;
            break;
        case BoardPart.BottomLeft:
            isNearBoard = getSegmentDist(puckX, puckY, CORNER_SEGMENT_SIZE_PX, RINK_WIDTH_PX, 0, RINK_WIDTH_PX - CORNER_SEGMENT_SIZE_PX) <= PUCK_RADIUS_PX;
            break;
        case BoardPart.TopLeft:
            isNearBoard = getSegmentDist(puckX, puckY, 0, CORNER_SEGMENT_SIZE_PX, CORNER_SEGMENT_SIZE_PX, 0) <= PUCK_RADIUS_PX;
            break;
        case BoardPart.TopRight:
        default:
            isNearBoard = getSegmentDist(puckX, puckY, RINK_LENGTH_PX - CORNER_SEGMENT_SIZE_PX, 0, RINK_LENGTH_PX, CORNER_SEGMENT_SIZE_PX) <= PUCK_RADIUS_PX;
    }

    return isNearBoard ? targetBoardPart : null;
}

function getSegmentDist(objX: number, objY: number, x1: number, y1: number, x2: number, y2: number): number {
    return 0;
}

export function calculatePuckShift(speed: number, angle: number): [number, number] {
    return [Math.cos(angle) * speed / 10, Math.sin(angle) * speed / 10];
}

export function getRandomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}