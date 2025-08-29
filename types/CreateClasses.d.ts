declare module 'CreateClasses' {
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */
import { Vec3, Quaternion, Color, Entity, Player, Asset } from 'horizon/core';
declare class EditableEntity {
    readonly id: bigint;
    constructor(id: bigint);
}
declare class EditableScript {
    readonly id: string;
    constructor(id: string);
}
interface GlobalThis {
    createVec3: (_x: number, _y: number, _z: number) => Vec3;
    createQuaternion: (_x: number, _y: number, _z: number, _w: number) => Quaternion;
    createColor: (_red: number, _green: number, _blue: number) => Color;
    createEntity: (_id: bigint) => Entity;
    createPlayer: (_id: number) => Player;
    createAsset: (_id: bigint, _versionId: bigint | undefined) => Asset;
    createEditableEntity: (_id: bigint) => EditableEntity;
    createEditableScript: (_id: string) => EditableScript;
}
declare global {
    let globalThis: GlobalThis;
}
export {};

}