export interface Point {
    x: number;
    y: number;
}

export interface Movable {
    point: Point;
    destination?: Point;
    angle?: number;
    speed?: number;
}

export interface Puck extends Movable {}

export interface Player extends Movable {
    color: string;
    id?: string;
    name?: string;
    number?: number;
    hasPuck?: boolean;
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