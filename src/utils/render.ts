import { BoardPart, Movable, Player, Puck } from '../types';

export const PI = Math.PI;
export const PUCK_RADIUS_PX = 4;
export const PUCK_CLEANUP_RADIUS_PX = PUCK_RADIUS_PX + 2;
export const RINK_WIDTH_PX = 400;
export const CORNER_SEGMENT_SIZE_PX = 60;
export const RINK_LENGTH_PX = RINK_WIDTH_PX * 2.215;
export const PLAYER_SIZE_PX = RINK_WIDTH_PX / 12;
export const PUCK_MAX_SPEED = 200;
export const PUCK_BOUNCE_MIN_SPEED_DECREASE = 5;
export const PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE = 50;
export const PUCK_SPEED_DECREASE_RATIO = 0.05;

export function drawPuck(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(0, 0, PUCK_RADIUS_PX, 0, PI * 2);
    ctx.fillStyle = '#444';
    ctx.fill();
}

export function drawPlayer(ctx: CanvasRenderingContext2D, jerseyImage: HTMLImageElement, { x, y, number }: Player): void {
    ctx.drawImage(jerseyImage!, x - PLAYER_SIZE_PX / 2, y - PLAYER_SIZE_PX / 2, PLAYER_SIZE_PX, PLAYER_SIZE_PX);
    ctx.fillStyle = 'white';
    ctx.font = 'bold ' + PLAYER_SIZE_PX / 3.5 + 'pt Arial bold';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), x, y);
}

function getBoardPart({ x, y, angle, speed }: Movable): BoardPart | null {
    if (!speed || angle === undefined) return null;

    if (angle <= 0) {
        angle += 2 * PI;
    }

    if (angle > 0 && angle <= PI / 2) {
        const rightBoardDist = RINK_LENGTH_PX - x;
        const bottomBoardDist = RINK_WIDTH_PX - y;

        if (Math.tan(angle) * rightBoardDist < bottomBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Right;
        } else if (Math.tan(PI / 2 - angle) * bottomBoardDist < rightBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Bottom;
        } else {
            return BoardPart.BottomRight;
        }
    }

    if (angle > PI / 2 && angle <= PI) {
        const bottomBoardDist = RINK_WIDTH_PX - y;
        const leftBoardDist = x;

        if (Math.tan(angle - PI / 2) * bottomBoardDist < leftBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Bottom;
        } else if (Math.tan(PI - angle) * leftBoardDist < bottomBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Left;
        } else {
            return BoardPart.BottomLeft;
        }
    }

    if (angle > PI && angle <= 3 * PI / 2) {
        const leftBoardDist = x;
        const topBoardDist = y;

        if (Math.tan(angle - PI) * leftBoardDist < topBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Left;
        } else if (Math.tan(3 * PI / 2 - angle) * topBoardDist < leftBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Top;
        } else {
            return BoardPart.TopLeft;
        }
    }

    const topBoardDist = y;
    const rightBoardDist = RINK_LENGTH_PX - x;

    if (Math.tan(angle - 3 * PI / 2) * topBoardDist < rightBoardDist - CORNER_SEGMENT_SIZE_PX) {
        return BoardPart.Top;
    } else if (Math.tan(2 * PI - angle) * rightBoardDist < topBoardDist - CORNER_SEGMENT_SIZE_PX) {
        return BoardPart.Right;
    } else {
        return BoardPart.TopRight;
    }
}

export function getBounceBoardPart(puck: Puck): BoardPart | null {
    const targetBoardPart = getBoardPart(puck);
    const { x, y } = puck;
    let isNearBoard = false;
    let cornerDist;

    switch (targetBoardPart) {
        case BoardPart.Right:
            isNearBoard = x >= RINK_LENGTH_PX - PUCK_RADIUS_PX;
            break;
        case BoardPart.Bottom:
            isNearBoard = y >= RINK_WIDTH_PX - PUCK_RADIUS_PX;
            break;
        case BoardPart.Left:
            isNearBoard = x <= PUCK_RADIUS_PX;
            break;
        case BoardPart.Top:
            isNearBoard = y <= PUCK_RADIUS_PX;
            break;
        case BoardPart.BottomRight:
            cornerDist = getSegmentDist([x, y], [RINK_LENGTH_PX, RINK_WIDTH_PX - CORNER_SEGMENT_SIZE_PX], [RINK_LENGTH_PX - CORNER_SEGMENT_SIZE_PX, RINK_WIDTH_PX]);
            isNearBoard = cornerDist <= PUCK_RADIUS_PX || isPointOutsideRink(x, y, PUCK_RADIUS_PX);
            break;
        case BoardPart.BottomLeft:
            cornerDist = getSegmentDist([x, y], [CORNER_SEGMENT_SIZE_PX, RINK_WIDTH_PX], [0, RINK_WIDTH_PX - CORNER_SEGMENT_SIZE_PX]);
            isNearBoard = cornerDist <= PUCK_RADIUS_PX || isPointOutsideRink(x, y, PUCK_RADIUS_PX);
            break;
        case BoardPart.TopLeft:
            cornerDist = getSegmentDist([x, y], [0, CORNER_SEGMENT_SIZE_PX], [CORNER_SEGMENT_SIZE_PX, 0]);
            isNearBoard = cornerDist <= PUCK_RADIUS_PX || isPointOutsideRink(x, y, PUCK_RADIUS_PX);
            break;
        case BoardPart.TopRight:
            cornerDist = getSegmentDist([x, y], [RINK_LENGTH_PX - CORNER_SEGMENT_SIZE_PX, 0], [RINK_LENGTH_PX, CORNER_SEGMENT_SIZE_PX]);
            isNearBoard = cornerDist <= PUCK_RADIUS_PX || isPointOutsideRink(x, y, PUCK_RADIUS_PX);;
            break;
        default:
            return null;
    }

    return isNearBoard ? targetBoardPart : null;
}

export function getDeflectedAngle(bounceBoardPart: BoardPart, initialAngle: number): number {
    switch (bounceBoardPart) {
        case BoardPart.Top:
        case BoardPart.Bottom:
            return 2 * PI - initialAngle;
        case BoardPart.Left:
        case BoardPart.Right:
            return PI - initialAngle;
        case BoardPart.TopLeft:
            return initialAngle - PI * 3 / 4;
        case BoardPart.TopRight:
            return initialAngle - PI * 5 / 4;
        case BoardPart.BottomLeft:
            return PI / 4 - initialAngle;
        case BoardPart.BottomRight:
            return initialAngle - PI / 2;
        default:
            return initialAngle;
    }
}

function isPointOutsideRink(x: number, y: number, safeBoardDist: number = 0): boolean {
    return x <= safeBoardDist || x >= RINK_LENGTH_PX - safeBoardDist || y <= safeBoardDist || y >= RINK_WIDTH_PX - safeBoardDist;
}

function getSegmentDist(point: [number, number], segmentStart: [number, number], segmentEnd: [number, number]): number {
    const segmentVector = [segmentEnd[0] - segmentStart[0], segmentEnd[1] - segmentStart[1]];
    const pointVector = [point[0] - segmentStart[0], point[1] - segmentStart[1]];
    const segmentLengthSquared = segmentVector[0] * segmentVector[0] + segmentVector[1] * segmentVector[1];
    const t = Math.max(0, Math.min(1, (pointVector[0] * segmentVector[0] + pointVector[1] * segmentVector[1]) / segmentLengthSquared));
    const closestPoint = [segmentStart[0] + t * segmentVector[0], segmentStart[1] + t * segmentVector[1]];
    const distanceVector = [point[0] - closestPoint[0], point[1] - closestPoint[1]];

    return Math.sqrt(distanceVector[0] * distanceVector[0] + distanceVector[1] * distanceVector[1]);
}

export function calculatePuckShift(speed: number, angle: number): [number, number] {
    return [Math.cos(angle) * speed / 10, Math.sin(angle) * speed / 10];
}

export function getRandomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

