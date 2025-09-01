declare module 'horizon/camera' {
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */
import { Vec3, Quaternion, Player, Entity, ReadableHorizonProperty, HorizonProperty } from 'horizon/core';
/**
 * The name of the camera API.
 */
export declare const ApiName = "camera";
/**
 * The styles for camera transitions.
 */
export declare enum Easing {
    EaseIn = 0,
    EaseOut = 1,
    EaseInOut = 2,
    Linear = 3
}
/**
 * The possible reasons for a camera transition to end.
 */
export declare enum CameraTransitionEndReason {
    Completed = 0,
    Interrupted = 1,
    Error = 2
}
/**
 * The view modes for cameras.
 */
export declare enum CameraMode {
    FirstPerson = 0,
    ThirdPerson = 1,
    Attach = 2,
    Fixed = 3,
    Orbit = 4,
    Pan = 5,
    Follow = 6
}
/**
 * The options for transitioning between cameras.
 *
 * @remarks
 *
 * Type Parameters:
 *
 * delay - The time, in seconds, to wait until the transition begins.
 * Defaults to 0.
 *
 * duration - The time, in seconds, to transition from the previous
 * camera to the new local camera. If not set, the transition is instant.
 *
 * Easing - The style in which the transition from the previous to
 * the new camera occurs over time. Defaults to Linear.
 */
export declare type CameraTransitionOptions = {
    delay?: number;
    duration?: number;
    easing?: Easing;
};
/**
 * Available options when applying a follow camera.
 * @remarks
 * Type Parameters:
 *
 * `activationDelay` - (number) The delay from when the auto-turning is enabled
 * after camera has been manually turned. Default = 2.0
 *
 * `cameraTurnSpeed` - (number) Modifier for the speed at which the camera turns to return behind the player avatar.
 * 0.5 = 50% speed, 1 = 100% speed etc. Default = 1.0
 *
 * `continuousRotation` - (bool) Enable the camera to continually rotate to behind the player
 * once rotation has started and not interrupted or disable to only allow the rotation while player moves. Default = false
 *
 * `distance` - (number) The distance from the target to the camera. If not set,
 * the camera remains at its current distance. Default = 5.0
 *
 * `horizonLevelling` - (bool) Enables levelling the camera to the horizon.
 * Default = false
 *
 * `rotationSpeed` - Controls how quickly the camera rotates to the desired rotation during transitions between cameras.
 * If not set, the camera is always snapped to it instantly.
 *
 * `translationSpeed` - Controls how quickly the camera moves to the desired position.
 * If not set, the camera is always snapped to it instantly.
 *
 * `verticalOffset` - Vertical offset up from the target position.
 * Camera rotates around the offsetted point
 */
export declare type FollowCameraOptions = {
    activationDelay?: number;
    cameraTurnSpeed?: number;
    continuousRotation?: boolean;
    distance?: number;
    horizonLevelling?: boolean;
    rotationSpeed?: number;
    translationSpeed?: number;
    verticalOffset?: number;
};
/**
 * Available options when applying an orbit camera.
 *
 * @remarks
 *
 * Type Parameters:
 *
 * `distance` - (number) The distance from the target to the camera. If not set,
 * the camera remains at its current distance. Default = 5.0
 *
 * `verticalOffset` - Vertical offset up from the target position.
 * Camera rotates around the offsetted point
 *
 * `translationSpeed` - Controls how quickly the camera moves to the desired position.
 * If not set, the camera is always snapped to it instantly.
 *
 * `rotationSpeed` - Controls how quickly the camera rotates to the desired rotation.
 * If not set, the camera is always snapped to it instantly.
 */
export declare type OrbitCameraOptions = {
    distance?: number;
    verticalOffset?: number;
    translationSpeed?: number;
    rotationSpeed?: number;
};
/**
 * Available options when applying a pan camera.
 *
 * @remarks
 *
 * Type Parameters:
 *
 * positionOffset - (number) The distance from the target to the camera. If not set,
 * the camera remains at its current distance. Default = 5.0
 *
 * translationSpeed - Controls how quickly the camera moves with the
 * target it's attached to. If not set, the camera is always snapped
 * to the position offset from the target.
 */
export declare type PanCameraOptions = {
    positionOffset?: Vec3;
    translationSpeed?: number;
};
/**
 * The available options to apply when activating a fixed camera.
 *
 * @remarks
 *
 * Type Parameters:
 *
 * position - (Vec3) The position in world space to set the camera to.
 * If not set, the camera will maintain it's current position.
 *
 * rotation - The rotation for the camera to face. If not set, the
 * camera maintains its current rotation.
 */
export declare type FixedCameraOptions = {
    position?: Vec3;
    rotation?: Quaternion;
};
/**
 * Options used to determine the behavior of a camera in {@link Camera.setCameraModeAttach | attached mode}.
 *
 * @remarks
 *
 * Type Parameters:
 *
 * A camera in attached mode is locked to a position relative to the target's
 * position, with a rotation relative to the target's rotation.
 *
 * `positionOffset` - The local space offset relative to the target.
 * If not set, the camera is attached directly to the target's position.
 *
 * `rotationOffset` - The local space rotation relative to the target.
 * If not set, the camera faces the same direction as the target.
 *
 * `translationSpeed` - Controls how quickly the camera moves with the
 * target it's attached to. If not set, the camera is always snapped
 * to the position offset from the target.
 *
 * `rotationSpeed` - Controls how quickly the camera rotates to keep the
 * target in view. If not set, the camera always points in the same
 * direction the target is facing.
 */
export declare type AttachCameraOptions = {
    positionOffset?: Vec3;
    rotationOffset?: Vec3 | Quaternion;
    translationSpeed?: number;
    rotationSpeed?: number;
};
/**
 * Options available when forcing a camera to look at a target.
 *
 * `duration` - The time, in seconds, during which the camera will be stuck in forced look at if not interrupted.
 * This time doesn't include the transition times (in and out).
 * If not set, the camera will be stuck in forced look at until interrupted.
 *
 * `offset` - The offset from the target position to look at (in target's space).
 *
 * `transitionIn` - The options for the transition in to the forced look at.
 * If undefined, the transition will be instant.
 *
 * `transitionOut` - The options for the transition out of the forced look at if not interrupted.
 * If undefined, the transition will be instant.
 */
export declare type ForceLookAtOptions = {
    duration?: number;
    offset?: Vec3;
    transitionIn?: CameraTransitionOptions;
    transitionOut?: CameraTransitionOptions;
};
/**
 * Options available when stopping a camera from looking at a target.
 *
 * `useForceLookAtTransitionOutOptions` - If true, the transition out options from the {@link ForceLookAtOptions} will be used.
 *
 * `transition` - describes the behavior of the transition out of the forced look at.
 * If undefined, the transition will be instant.
 * If `useForceLookAtTransitionOutOptions` is true, the options for the transition out of the forced look at will be used.
 */
export declare type StopLookAtOptions = {
    useForceLookAtTransitionOutOptions?: boolean;
    transition?: CameraTransitionOptions;
};
/**
 * The camera target type used by a camera in {@link Camera.setCameraModeAttach | attached mode}.
 */
export declare type CameraTarget = Entity | Player;
/**
 * The base interface for manipulating camera mode properties.
 */
export interface ICameraMode {
}
/**
 * Manipulates runtime properties of cameras in first person mode, which
 * uses a camera view from the eyes of the player avatar.
 *
 * @remarks
 * The {@link Camera.setCameraModeFirstPerson} method enables first person camera mode. For
 * more information on setting camera modes at runtime, see the
 * {@link https://developers.meta.com/horizon-worlds/learn/documentation/create-for-web-and-mobile/typescript-apis-for-mobile/camera | Camera} guide.
 */
export declare class FirstPersonCameraMode implements ICameraMode {
}
/**
 * Manipulates runtime properties of cameras in third person mode, which
 * uses a camera view that follows the local player avatar.
 *
 * @remarks
 * The {@link Camera.setCameraModeThirdPerson} method enables third person camera mode. For
 * more information on setting camera modes at runtime, see the
 * {@link https://developers.meta.com/horizon-worlds/learn/documentation/create-for-web-and-mobile/typescript-apis-for-mobile/camera | Camera} guide.
 */
export declare class ThirdPersonCameraMode implements ICameraMode {
}
/**
 * Manipulates runtime properties of cameras in attach mode. When attach
 * mode is enabled for a camera, it follows a target entity's position
 * and rotation.
 *
 * @remarks
 * The {@link Camera.setCameraModeAttach} method enables attach mode for
 * a camera.
 */
export declare class AttachCameraMode implements ICameraMode {
    /**
     * Local offset from the target position. Target's frame of reference.
     */
    positionOffset: HorizonProperty<Vec3>;
    /**
     * Local rotation from the target rotation. Target's frame of reference.
     */
    rotationOffset: HorizonProperty<Quaternion>;
    /**
     * Controls how quickly the camera moves with the
     * target it's attached to. If not set, the camera is always snapped
     * to the position offset from the target.
     */
    translationSpeed: HorizonProperty<number | null>;
    /**
     * Controls how quickly the camera rotates to keep the
     * target in view. If not set, the camera always points in the same
     * direction the target is facing.
     */
    rotationSpeed: HorizonProperty<number | null>;
}
/**
 * Manipulates runtime properties of cameras in fixed camera mode, where
 * the camera view is set to a fixed world position and rotation.
 *
 * @remarks
 * The {@link Camera.setCameraModeFixed} method enables fixed camera mode. For
 * more information on setting camera modes at runtime, see the
 * {@link https://developers.meta.com/horizon-worlds/learn/documentation/create-for-web-and-mobile/typescript-apis-for-mobile/camera | Camera} guide.
 */
export declare class FixedCameraMode implements ICameraMode {
}
/**
 * Manipulates runtime properties of cameras in orbit mode, where
 * camera view follows the player avatar without being fixed behind the
 * player.
 *
 * @remarks
 * The {@link Camera.setCameraModeOrbit} method enables orbit mode. For
 * more information on setting camera modes at runtime, see the
 * {@link https://developers.meta.com/horizon-worlds/learn/documentation/create-for-web-and-mobile/typescript-apis-for-mobile/camera | Camera} guide.
 */
export declare class OrbitCameraMode implements ICameraMode {
    /**
     * Camera rotation radius around the target.
     */
    distance: HorizonProperty<number>;
    /**
     * Vertical offset up from the target position.
     * Camera rotates around the offsetted point
     */
    verticalOffset: HorizonProperty<number>;
    /**
     * Controls how quickly the camera moves to the desired position.
     * If not set, the camera is always snapped to it instantly.
     */
    translationSpeed: HorizonProperty<number | null>;
    /**
     * Controls how quickly the camera rotates to the desired rotation.
     * If not set, the camera is always snapped to it instantly.
     */
    rotationSpeed: HorizonProperty<number | null>;
}
/**
 * Manipulates runtime properties of cameras in pan camera mode. In pan camera mode,
 * the camera follows the player at a fixed position that you set adjacent to the player.
 *
 * @remarks
 * The {@link Camera.setCameraModePan} method enables pan camera mode. For
 * more information on setting camera modes at runtime, see the
 * {@link https://developers.meta.com/horizon-worlds/learn/documentation/create-for-web-and-mobile/typescript-apis-for-mobile/camera | Camera} guide.
 */
export declare class PanCameraMode implements ICameraMode {
    /**
     * Local offset from the target position. Camera keeps looking at target.
     */
    positionOffset: HorizonProperty<Vec3>;
    /**
     * Controls how quickly the camera moves to the desired position.
     * If not set, the camera is always snapped to it instantly.
     */
    translationSpeed: HorizonProperty<number | null>;
}
/**
 * Manipulates runtime properties of cameras in Follow mode.
 */
export declare class FollowCameraMode implements ICameraMode {
    /**
     * Camera auto-turning activation delay after camera has been manually turned.
     */
    activationDelay: HorizonProperty<number>;
    /**
     * Speed at which the camera turns to return behind the player avatar.
     */
    cameraTurnSpeed: HorizonProperty<number>;
    /**
     * Enables continuous rotation of the camera to return behind the player avatar once rotation had started and isn't interrupted.
     */
    continuousRotation: HorizonProperty<boolean>;
    /**
     * Camera rotation radius around the target.
     */
    distance: HorizonProperty<number>;
    /**
     * Enables levelling the camera to the horizon.
     */
    horizonLevelling: HorizonProperty<boolean>;
    /**
     * Vertical offset up from the target position.
     * Camera rotates around the offsetted point
     */
    verticalOffset: HorizonProperty<number>;
    /**
     * Controls how quickly the camera moves to the desired position.
     * If not set, the camera is always snapped to it instantly.
     */
    translationSpeed: HorizonProperty<number | null>;
    /**
     * Controls how quickly the camera rotates to the desired rotation.
     * If not set, the camera is always snapped to it instantly.
     */
    rotationSpeed: HorizonProperty<number | null>;
}
/**
 * Manages the view, position, and features of the in-game camera.
 */
export declare class Camera {
    /**
     * The type of camera that is active.
     *
     * @remarks For native cameras, this property indicates
     * whether the camera is in first or third person mode.
     */
    currentMode: ReadableHorizonProperty<CameraMode>;
    /**
     * The camera roll angle.
     *
     * @remarks
     * You can change this value over time using {@link setCameraRollWithOptions}.
     */
    cameraRoll: HorizonProperty<number>;
    /**
     * Indicates whether camera collision is enabled.
     */
    collisionEnabled: HorizonProperty<boolean>;
    /**
     * Indicates whether the player is allowed to toggle between first and third person modes.
     *
     * @remarks
     * This property does not affect a script's ability to forcibly enable 1st or 3rd person mode
     * with {@link Camera.SetCameraModeFirstPerson} or {@link Camera.SetCameraModeThirdPerson}. This property
     * has as no effect in VR, where first person is always enabled.
     *
     * @example
     * ```
     * if (LocalCamera !== null) {
     *   LocalCamera.position.get()
     * }
     * ```
     */
    perspectiveSwitchingEnabled: HorizonProperty<boolean>;
    /**
     * Gets the position of the camera.
     *
     * @example
     * ```
     * if (LocalCamera !== null) {
     *   LocalCamera.position.get()
     * }
     * ```
     */
    position: ReadableHorizonProperty<Vec3>;
    /**
     * Gets the rotation of the camera.
     *
     * @example
     * ```
     * if (LocalCamera !== null) {
     *   LocalCamera.rotation.get()
     * }
     * ```
     */
    rotation: ReadableHorizonProperty<Quaternion>;
    /**
     * Gets the forward direction of the camera.
     *
     * @example
     * ```
     * if (LocalCamera !== null) {
     *   LocalCamera.forward.get()
     * }
     * ```
     */
    forward: ReadableHorizonProperty<Vec3>;
    /**
     * Gets the up direction of the camera.
     *
     * @example
     * ```
     * if (LocalCamera !== null) {
     *   LocalCamera.up.get()
     * }
     * ```
     */
    up: ReadableHorizonProperty<Vec3>;
    /**
     * Gets the world space position that first intersects the center of the camera
     * view, ignoring the avatar of the local player.
     *
     * @example
     * ```
     * if (LocalCamera !== null) {
     *   var lookAtPosition = LocalCamera.lookAtPosition.get();
     * }
     * ```
     */
    lookAtPosition: ReadableHorizonProperty<Vec3>;
    /**
     * Sets the current camera to a fixed world position and rotation.
     *
     * @param options - If not set, the camera remains fixed in place from it's current position and orientation.
     *
     * @example Move the camera to a new position over a period of 1 second, maintaining its current orientation.
     * ```
     * localCamera.setFixedCameraPosition({position: pos}, {duration: 1.0});
     * ```
     * @example Keep the camera where it currently is, but point it straight downwards instantly.
     * ```
     * localCamera.setFixedCameraPosition({lookAt: getCameraPos() + new Vec3(0,-1,0)});
     * ```
     * @public
     */
    setCameraModeFixed(options?: FixedCameraOptions & CameraTransitionOptions): Promise<CameraTransitionEndReason>;
    /**
     * Enables attach mode for a camera, which automatically follows a target entity's position and rotation.
     *
     * @param target - The entity for the tracking camera to follow.
     * @param options - If not set, the camera instantly matches the target's position and rotation.
     *
     * @remarks
     * If the target entity is destroyed, camera tracking stops with the camera remaining where it was
     * before losing the target. This method has no effect in VR, where only first person cameras are
     * permitted.
     *
     * @example Place the camera at a fixed position relative to the player, over a period of 1 second.
     * ```
     * localCamera.setCameraModeAttach(player, {positionOffset = position, duration: 1.0});
     * ```
     * @public
     */
    setCameraModeAttach(target: CameraTarget, options?: AttachCameraOptions & CameraTransitionOptions): Promise<CameraTransitionEndReason>;
    /**
     * Enables the standard third-person game camera, which follows the local player avatar.
     *
     * @param options - Optional {@link CameraTransitionOptions} that define how the previous camera should transition
     * to this new camera. If not set, the transition is instant.
     *
     * @remarks
     * Disables any previously set camera, ignores the current value of
     * {@link Camera.perspectiveSwitchingEnabled}, and has no effect in VR
     * where only first person is allowed.
     *
     * @example Enable the third person over a period of 1 second.
     * ```
     * localCamera.setCameraModeThirdPerson({duration: 1.0});
     * ```
     * @public
     */
    setCameraModeThirdPerson(options?: CameraTransitionOptions): Promise<CameraTransitionEndReason>;
    /**
     * Enables the standard first-person game camera, which
     * uses a camera view from the eyes of the player avatar.
     *
     * @param options - Optional {@link CameraTransitionOptions} that define how the previous camera should
     * transition to this new camera. If not set, the transition is instant.
     *
     * @remarks
     * Disables any previously set camera. Ignores the current value of
     * {@link Camera.perspectiveSwitchingEnabled}. Has no effect in VR, where first person is
     * always enabled.
     *
     * @example Enable the first person camera after a delay of 1 second.
     * ```
     * localCamera.setCameraModeFirstPerson({delay: 1.0});
     * ```
     * @public
     */
    setCameraModeFirstPerson(options?: CameraTransitionOptions): Promise<CameraTransitionEndReason>;
    /**
     * Enables the orbit camera, which follows the local player avatar.
     *
     * @param options - Optional {@link CameraTransitionOptions} that define how the previous camera should
     * transition to this new camera. If not set, the transition is instant.
     *
     * @remarks
     * Disables any previously set camera. Ignores the current value of
     * {@link perspectiveSwitchingEnabled}. and has no effect in VR
     * where only first person is allowed.
     *
     * @example Enable the orbit camera after a delay of 1 second.
     * ```
     * localCamera.setCameraModeOrbit({delay: 1.0});
     * ```
     * @public
     */
    setCameraModeOrbit(options?: OrbitCameraOptions & CameraTransitionOptions): Promise<CameraTransitionEndReason>;
    /**
     * Enables the pan camera, which follows the local player avatar at a fixed vector offset.
     *
     * @param options - Optional {@link CameraTransitionOptions} that define how the previous camera should
     * transition to this new camera. If not set, the transition is instant.
     *
     * @remarks
     * Disables any previously set camera. Ignores the current value of
     * {@link perspectiveSwitchingEnabled}. and has no effect in VR
     * where only first person is allowed.
     *
     * @example Enable the pan camera after a delay of 1 second.
     * ```
     * localCamera.setCameraModePan({delay: 1.0});
     * ```
     * @public
     */
    setCameraModePan(options?: PanCameraOptions & CameraTransitionOptions): Promise<CameraTransitionEndReason>;
    /**
     * Enables the follow camera, which follows and auto-turns to be behind the local player avatar.
     *
     * @param options - Optional {@link CameraTransitionOptions} that define how the previous camera should
     * transition to this new camera. If not set, the transition is instant.
     *
     * @remarks
     * Disables any previously set camera. Ignores the current value of
     * {@link perspectiveSwitchingEnabled}. and has no effect in VR
     * where only first person is allowed.
     *
     * @example Enable the follow camera after a delay of 1 second.
     * ```
     * localCamera.setCameraModeFollow({delay: 1.0});
     * ```
     * @public
     */
    setCameraModeFollow(options?: FollowCameraOptions & CameraTransitionOptions): Promise<CameraTransitionEndReason>;
    /**
     * Set the field of view of the camera.
     *
     * @param fov - The new field of view value to transition towards.
     * @param options - Optional {@link CameraTransitionOptions} that define how the previous field of view
     * should transition to the new one. If not set, the transition is instant.
     *
     * @remarks
     * Prevents the native camera from adjusting the field of view automatically, until
     * {@link Camera.resetCameraFOV} is called. For example, the third person camera zooms in a
     * little while you sprint.
     *
     * @example Adjust the camera field of view to 50 over a period of 1 second.
     * ```
     * localCamera.overrideCameraFOV(50.0, {duration: 1.0);
     * ```
     * @public
     */
    overrideCameraFOV(fov: number, options?: CameraTransitionOptions): Promise<CameraTransitionEndReason>;
    /**
     * Clears any field of view override, resetting it to the default native camera value.
     *
     * @param options - Optional {@link CameraTransitionOptions} that define how the previous field of view
     * should transition to the new field of view. If not set, the transition is instant.
     *
     * @remarks
     * Prevents the native camera from adjusting the field of view automatically until
     * {@link Camera.resetCameraFOV} is called. For example, the third person camera zooms in
     * a little while the player sprints.
     *
     * @example Reset the field of view over a period of 1 second.
     * ```
     * localCamera.resetCameraFOV({duration: 1.0);
     * ```
     * @public
     */
    resetCameraFOV(options?: CameraTransitionOptions): Promise<CameraTransitionEndReason>;
    /**
     * Adjusts the current camera roll over time.
     *
     * @param rollAngle - The roll rotation, in degrees, to set on the the current camera.
     * @param options - Optional {@link CameraTransitionOptions} that define how the previous roll should
     * transition to the new roll. If not set, the transition is instant.
     *
     * @example Roll the camera by 10 degrees left over 1 second.
     * ```
     * localCamera.setCameraRoll(-10, {duration: 1.0});
     * ```
     * @public
     */
    setCameraRollWithOptions(rollAngle: number, options?: CameraTransitionOptions): Promise<CameraTransitionEndReason>;
    /**
     * Set the far clip plane of the camera.
     *
     * @param farClipPlane - The new far clip plane value to transition towards.
     * @param options - Optional {@link CameraTransitionOptions} that define how the previous far clip plane
     * should transition to the new one. If not set, the transition is instant.
     *
     * @remarks
     * Prevents the native camera from adjusting the far clip plane automatically, until
     * {@link Camera.resetCameraFarClipPlane} is called.
     *
     * @example Adjust the camera far clip plane to 50 over a period of 1 second.
     * ```
     * localCamera.overrideCameraFarClipPlane(50.0, {duration: 1.0);
     * ```
     * @public
     */
    overrideCameraFarClipPlane(farClipPlane: number, options?: CameraTransitionOptions): Promise<CameraTransitionEndReason>;
    /**
     * Clears any far clip plane override, resetting it to the default native camera value.
     *
     * @param options - Optional {@link CameraTransitionOptions} that define how the far clip plane should
     * transition to the default far clip plane. If not set, the transition is instant.
     *
     * @example Reset the far clip plane over a period of 1 second.
     * ```
     * localCamera.resetCameraFarClipPlane({duration: 1.0);
     * ```
     * @public
     */
    resetCameraFarClipPlane(options?: CameraTransitionOptions): Promise<CameraTransitionEndReason>;
    /**
     * Converts a world position to a screen position on mobile and desktop.
     *
     * X: 0.0, Y: 0.0 represents the top left of the screen.
     *
     * X: 0.5, Y: 0.5 represents the center of the screen.
     *
     * X: 1.0, Y: 1.0 represents the bottom right of the screen.
     *
     * Z represents the distance to the object, negative will be behind the camera.
     *
     * @param worldPos - The world position to convert.
     * @returns A Vec3 representing the screen position.
     */
    convertWorldToScreenPoint(worldPos: Vec3): Vec3;
    /**
     * Get the current camera mode object.
     */
    private getCameraModeObject;
    /**
     * Gets the current camera mode object as a specific type.
     *
     * @param classType - The type of camera mode object to get. Must extend ICameraMode.
     * @returns The camera mode object as the specified type, or null if the camera mode object is not of the specified type.
     *
     * @example Get the current camera mode object as OrbitCameraMode:
     * ```
     * LocalCamera.getCameraModeObjectAs(OrbitCameraMode);
     * ```
     */
    getCameraModeObjectAs<TRuntimeCameraMode extends ICameraMode>(classType: new () => TRuntimeCameraMode): TRuntimeCameraMode | null;
    /**
     * Forces the camera to look at a target or position.
     *
     * Supported camera modes:
     *
     * - AttachCamera
     *
     * - OrbitCamera
     *
     * - FollowCamera
     *
     * @param target - The target to look at.
     * @param options - Options for the transition to and from the forced look.
     */
    forceLookAt(target: Player | Entity | Vec3, options?: ForceLookAtOptions): void;
    /**
     * Stop a force look at if any are active.
     * If `options` is not provided, an instant transition will be used.
     *
     * @param options - Options for the transition from the forced look.
     */
    stopForceLookAt(options?: StopLookAtOptions): void;
    /**
     * Checks whether the current active camera is force-looking at something.
     */
    isForceLookAtcamera: ReadableHorizonProperty<boolean>;
}
/**
 * Global camera instance.
 */
declare const LocalCamera: Camera;
export default LocalCamera;

}