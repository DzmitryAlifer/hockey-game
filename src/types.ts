export interface Movable {
    x: number;
    y: number;
    angle?: number;
    speed?: number;
}

export interface Puck extends Movable {}

export interface Player extends Movable {
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