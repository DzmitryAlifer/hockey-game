export interface Movable {
    x: number;
    y: number;
    angle: number;
    speed: number;
}

export interface Puck  {
    x: number;
    y: number;
    angle: number;
    speed: number;
}

export interface Player {
    id: string;
    name: string;
    number: number;
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