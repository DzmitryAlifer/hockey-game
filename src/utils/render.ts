import { BoardPart, Movable, Player, Point, Puck } from '../types';

export const PI = Math.PI;
export const PUCK_RADIUS_PX = 4;
export const PUCK_CLEANUP_RADIUS_PX = PUCK_RADIUS_PX + 2;
export const RINK_WIDTH_PX = 400;
export const CORNER_SEGMENT_SIZE_PX = 60;
export const RINK_LENGTH_PX = RINK_WIDTH_PX * 2.215;
export const PLAYER_SIZE_PX = RINK_WIDTH_PX / 12;
export const PLAYER_MAX_SPEED = 40;
export const PUCK_MAX_SPEED = 200;
export const PUCK_BOUNCE_MIN_SPEED_DECREASE = 5;
export const PUCK_MIN_SPEED_WITHOUT_ICE_RESISTANCE = 30;
export const PUCK_SPEED_DECREASE_RATIO = 0.02;
export const SPEED_TO_SHIFT_RATIO = 10;

export function drawPuck(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(0, 0, PUCK_RADIUS_PX, 0, PI * 2);
    ctx.fillStyle = '#444';
    ctx.fill();
}

export function drawPlayer(ctx: CanvasRenderingContext2D, jerseyImage: HTMLImageElement, { point, color, number }: Player): void {
    ctx.fillStyle = color;
    ctx.fillRect(point.x - PLAYER_SIZE_PX / 2, point.y - PLAYER_SIZE_PX / 2, PLAYER_SIZE_PX, PLAYER_SIZE_PX);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(jerseyImage!, point.x - PLAYER_SIZE_PX / 2, point.y - PLAYER_SIZE_PX / 2, PLAYER_SIZE_PX, PLAYER_SIZE_PX);
    ctx.globalCompositeOperation = 'source-over';
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold ' + PLAYER_SIZE_PX / 3.5 + 'pt Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), point.x, point.y);
}

function getBoardPart({ point, angle, speed }: Movable): BoardPart | null {
    if (!point || !speed || angle === undefined) return null;

    if (angle <= 0) {
        angle += 2 * PI;
    }

    if (angle > 2 * PI) {
        angle -= 2 * PI;
    }

    if (angle > 0 && angle <= PI / 2) {
        const rightBoardDist = RINK_LENGTH_PX - point.x;
        const bottomBoardDist = RINK_WIDTH_PX - point.y;

        if (Math.tan(angle) * rightBoardDist < bottomBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Right;
        } else if (Math.tan(PI / 2 - angle) * bottomBoardDist < rightBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Bottom;
        } else {
            return BoardPart.BottomRight;
        }
    }

    if (angle > PI / 2 && angle <= PI) {
        const bottomBoardDist = RINK_WIDTH_PX - point.y;
        const leftBoardDist = point.x;

        if (Math.tan(angle - PI / 2) * bottomBoardDist < leftBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Bottom;
        } else if (Math.tan(PI - angle) * leftBoardDist < bottomBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Left;
        } else {
            return BoardPart.BottomLeft;
        }
    }

    if (angle > PI && angle <= 3 * PI / 2) {
        const leftBoardDist = point.x;
        const topBoardDist = point.y;

        if (Math.tan(angle - PI) * leftBoardDist < topBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Left;
        } else if (Math.tan(3 * PI / 2 - angle) * topBoardDist < leftBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Top;
        } else {
            return BoardPart.TopLeft;
        }
    }

    const topBoardDist = point.y;
    const rightBoardDist = RINK_LENGTH_PX - point.x;

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
    const { point } = puck;
    let isNearBoard = false;
    let cornerDist;

    switch (targetBoardPart) {
        case BoardPart.Right:
            isNearBoard = point.x >= RINK_LENGTH_PX - PUCK_RADIUS_PX;
            break;
        case BoardPart.Bottom:
            isNearBoard = point.y >= RINK_WIDTH_PX - PUCK_RADIUS_PX;
            break;
        case BoardPart.Left:
            isNearBoard = point.x <= PUCK_RADIUS_PX;
            break;
        case BoardPart.Top:
            isNearBoard = point.y <= PUCK_RADIUS_PX;
            break;
        case BoardPart.BottomRight:
            cornerDist = getSegmentDist(point, { x: RINK_LENGTH_PX, y: RINK_WIDTH_PX - CORNER_SEGMENT_SIZE_PX }, { x: RINK_LENGTH_PX - CORNER_SEGMENT_SIZE_PX, y: RINK_WIDTH_PX });
            isNearBoard = cornerDist <= PUCK_RADIUS_PX || isPointOutsideRink(point, PUCK_RADIUS_PX);
            break;
        case BoardPart.BottomLeft:
            cornerDist = getSegmentDist(point, { x: CORNER_SEGMENT_SIZE_PX, y: RINK_WIDTH_PX }, { x: 0, y: RINK_WIDTH_PX - CORNER_SEGMENT_SIZE_PX });
            isNearBoard = cornerDist <= PUCK_RADIUS_PX || isPointOutsideRink(point, PUCK_RADIUS_PX);
            break;
        case BoardPart.TopLeft:
            cornerDist = getSegmentDist(point, { x: 0, y: CORNER_SEGMENT_SIZE_PX }, { x: CORNER_SEGMENT_SIZE_PX, y: 0 });
            isNearBoard = cornerDist <= PUCK_RADIUS_PX || isPointOutsideRink(point, PUCK_RADIUS_PX);
            break;
        case BoardPart.TopRight:
            cornerDist = getSegmentDist(point, { x: RINK_LENGTH_PX - CORNER_SEGMENT_SIZE_PX, y: 0 }, { x: RINK_LENGTH_PX, y: CORNER_SEGMENT_SIZE_PX });
            isNearBoard = cornerDist <= PUCK_RADIUS_PX || isPointOutsideRink(point, PUCK_RADIUS_PX);;
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

function isPointOutsideRink({ x, y }: Point, safeBoardDist: number = 0): boolean {
    return x <= safeBoardDist || x >= RINK_LENGTH_PX - safeBoardDist || y <= safeBoardDist || y >= RINK_WIDTH_PX - safeBoardDist;
}

function getSegmentDist(point: Point, segmentStart: Point, segmentEnd: Point): number {
    const segmentVector = { x: segmentEnd.x - segmentStart.x, y: segmentEnd.y - segmentStart.y };
    const pointVector = { x: point.x - segmentStart.x, y: point.y - segmentStart.x };
    const segmentLengthSquared = segmentVector.x * segmentVector.x + segmentVector.y * segmentVector.y;
    const t = Math.max(0, Math.min(1, (pointVector.x * segmentVector.x + pointVector.y * segmentVector.y) / segmentLengthSquared));
    const closestPoint = { x: segmentStart.x + t * segmentVector.x, y: segmentStart.y + t * segmentVector.y };
    const distanceVector = { x: point.x - closestPoint.x, y: point.y - closestPoint.y };

    return Math.sqrt(distanceVector.x * distanceVector.x + distanceVector.y * distanceVector.y);
}

export function calculateShift(speed: number, angle: number): Point {
    return { x: Math.cos(angle) * speed / SPEED_TO_SHIFT_RATIO, y: Math.sin(angle) * speed / SPEED_TO_SHIFT_RATIO };
}

export function calculatePlayerShift({ point, destination, speed }: Player): Point {
    const dx = destination!.x - point.x;
    const dy = destination!.y - point.y;
    const angle = PI / 2 - Math.atan(dx / dy) + (dy < 0 ? PI : 0);
    const { x, y } = calculateShift(speed!, angle);

    return {
        x: Math.abs(x) < Math.abs(dx) ? x : 0,
        y: Math.abs(y) < Math.abs(dy) ? y : 0, 
    };
}

export function getRandomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

