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

export enum PlayerPosition {
    C = 'C',
    LW = 'WD',
    RW = 'RW',
    LD = 'LD',
    RD = 'RD',
    G = 'G',
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
    aggressiveness: number;
    agility: number;
}

export interface PlayerStatus {
    hasPuck?: boolean;
    isOnIce?: boolean;
}

export interface PlayerPerson {
    id?: string; 
    team?: string;
    fieldPosition?: PlayerPosition;
    name?: string;
    number?: number;
}

export type Player = Sprite & Movable & PlayerSkills & PlayerStatus & PlayerPerson;
export type MovableGraphics = Graphics & Movable;
