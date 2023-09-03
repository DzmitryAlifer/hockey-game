import { Sprite, Graphics, Point } from 'pixi.js';

export interface PlayerPerson extends Movable {
    team: string;
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

export interface Movable {
    speed: number;
    shiftX: number;
    shiftY: number;
    acceleration?: Point;
    mass?: number;
    team?: string;
}


export type MovableSprite = Sprite & Movable;
export type MovableGraphics = Graphics & Movable;