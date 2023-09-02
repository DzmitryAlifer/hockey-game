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
    Left = 'l',
    Top = 't',
    Right = 'r',
    Bottom = 'b',
    TopLeft = 'tl',
    TopRight = 'tr',
    BottomLeft = 'bl',
    BottomRight = 'br',
}