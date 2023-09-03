import { Sprite, Graphics, Point } from 'pixi.js';

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
    currentSpeed: number;
    shiftX: number;
    shiftY: number;
    acceleration?: Point;
    mass?: number;
}

export interface PlayerSkills {
    speed: number;
    strength: number;
}

export interface PlayerStatus {
    hasPuck?: boolean;
    isOnIce?: boolean;
}

export interface PlayerPerson {
    team?: string;
    id?: string;
    name?: string;
    number?: number;
}

export type Player = Sprite & Movable & PlayerSkills & PlayerStatus & PlayerPerson;
export type MovableGraphics = Graphics & Movable;
