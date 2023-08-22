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
    angle: number;
    speed: number;
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


export function drawPuck(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(0, 0, PUCK_RADIUS_PX, 0, PI * 2);
    ctx.fillStyle = '#444';
    ctx.fill();
}

function getBoardPart({ puckX, puckY, angle, speed }: PuckShot): BoardPart|null {
    if (!speed) return null;

    if (angle > 0 && angle <= PI / 2) {
        const rightBoardDist = RINK_LENGTH_PX - puckX;
        const bottomBoardDist = RINK_WIDTH_PX - puckY;

        if (Math.tan(angle) * rightBoardDist < bottomBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Right;
        } else if (Math.tan(PI / 2 - angle) * bottomBoardDist < rightBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Bottom;
        } else {
            return BoardPart.BottomRight;
        }
    }

    if (angle > PI / 2 && angle <= PI) {
        const bottomBoardDist = RINK_WIDTH_PX - puckY;
        const leftBoardDist = puckX;

        if (Math.tan(angle - PI / 2) * bottomBoardDist < leftBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Bottom;
        } else if (Math.tan(PI - angle) * leftBoardDist < bottomBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Left;
        } else {
            return BoardPart.BottomLeft;
        }
    }

    if (angle > PI && angle <= 3 * PI / 2) {
        const leftBoardDist = puckX;
        const topBoardDist = RINK_WIDTH_PX - puckY;

        if (Math.tan(angle - PI) * leftBoardDist < topBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Left;
        } else if (Math.tan(3 * PI / 2 - angle) * topBoardDist < leftBoardDist - CORNER_SEGMENT_SIZE_PX) {
            return BoardPart.Top;
        } else {
            return BoardPart.TopLeft;
        }
    }

    const topBoardDist = RINK_WIDTH_PX - puckY;
    const rightBoardDist = RINK_LENGTH_PX - puckX;

    if (Math.tan(angle - 3 * PI / 2) * topBoardDist < rightBoardDist - CORNER_SEGMENT_SIZE_PX) {
        return BoardPart.Top;
    } else if (Math.tan(2 * PI - angle) * rightBoardDist < topBoardDist - CORNER_SEGMENT_SIZE_PX) {
        return BoardPart.Right;
    } else {
        return BoardPart.TopRight;
    }
}

export function getBoardBounce(puckShot: PuckShot): BoardPart | null {
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
            isNearBoard = getSegmentDist([puckX, puckY], [RINK_LENGTH_PX, RINK_WIDTH_PX - CORNER_SEGMENT_SIZE_PX], [RINK_LENGTH_PX - CORNER_SEGMENT_SIZE_PX, RINK_WIDTH_PX]) <= PUCK_RADIUS_PX;
            break;
        case BoardPart.BottomLeft:
            isNearBoard = getSegmentDist([puckX, puckY], [CORNER_SEGMENT_SIZE_PX, RINK_WIDTH_PX], [0, RINK_WIDTH_PX - CORNER_SEGMENT_SIZE_PX]) <= PUCK_RADIUS_PX;
            break;
        case BoardPart.TopLeft:
            isNearBoard = getSegmentDist([puckX, puckY], [0, CORNER_SEGMENT_SIZE_PX], [CORNER_SEGMENT_SIZE_PX, 0]) <= PUCK_RADIUS_PX;
            break;
        case BoardPart.TopRight:
            isNearBoard = getSegmentDist([puckX, puckY], [RINK_LENGTH_PX - CORNER_SEGMENT_SIZE_PX, 0], [RINK_LENGTH_PX, CORNER_SEGMENT_SIZE_PX]) <= PUCK_RADIUS_PX;
            break;
        default:
            return null;
    }

    return isNearBoard ? targetBoardPart : null;
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