declare module 'horizon/capturing' {
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */
import { Player, Vec3 } from 'horizon/core';
/**
 * A {@link CameraMovementPreset} option that provides a first
 * person camera view.
 */
export declare type FirstPersonMovementCameraMovementPreset = {
    strategy: 'FirstPerson';
};
/**
 * A {@link CameraMovementPreset} option that provides a
 * third-person over-the-shoulder camera view where the camera is
 * positioned slightly above and behind the player avatar.
 */
export declare type ThirdPersonOverShoulderCameraMovementPreset = {
    strategy: 'ThirdPersonOverShoulder';
};
/**
 * A {@link CameraMovementPreset} option that keeps the player avatar
 * in the center of the frame from a fixed position.
 */
export declare type FixedPositionTrackingPlayerCameraMovementPreset = {
    strategy: 'FixedLocationTrackingPlayer';
    fixedPosition: Vec3;
};
/**
 * The preset camera viewing angles to use when viewing and recording
 * a player's avatar as it moves throughout the world.
 *
 * @remarks
 * The available presets are:
 *
 * {@link FirstPersonMovementCameraMovementPreset}
 *
 * {@link ThirdPersonOverShoulderCameraMovementPreset}
 *
 * {@link FixedPositionTrackingPlayerCameraMovementPreset}
 */
export declare type CameraMovementPreset = FirstPersonMovementCameraMovementPreset | ThirdPersonOverShoulderCameraMovementPreset | FixedPositionTrackingPlayerCameraMovementPreset;
/**
 * The flags for notification types to show players after video recording completes.
 *
 * @privateRemarks
 * Must remain in sync with VideoCaptureNotifications in IScriptingRuntime.cs.
 */
export declare enum VideoCaptureNotifications {
    /**
     * Don't show any notifications.
     */
    None = 0,
    /**
     * Show a toast notification.
     */
    Toast = 1,
    /**
     * Show all notifications.
     *
     * @privateRemarks
     * When adding new types, make sure to " | <NewType>"
     */
    All = 1
}
/**
 * The default {@link StartVideoCaptureOptions | options} for the {@link startVideoCapture} method.
 *
 * @remarks
 * `duration`: 60.0
 *
 * `saveOnDurationReached`: true
 *
 * `notifications`: VideoCaptureNotifications.All
 */
export declare const DefaultStartVideoCaptureOptions: StartVideoCaptureOptions;
/**
 * The default {@link StopVideoCaptureOptions | options} for the {@link stopVideoCapture} method.
 *
 * @remarks
 * `save`: true
 */
export declare const DefaultStopVideoCaptureOptions: StopVideoCaptureOptions;
/**
 * The video recording capabilities from the players point of view.
 *
 * @remarks This class contains methods for recording in-game footage from
 * the players point of view at key moments during game play. For details,
 * see the {@link https://developers.meta.com/horizon-worlds/learn/documentation/typescript/api-references-and-examples/instant-replay | Instant Replay } guide.
 */
export declare class PlayerCapturing extends Player {
    /**
     * Starts recording a video from the player's point of view.
     *
     * @remarks
     * Call the {@link stopVideoCapture} method to end the recording.
     *
     * @param momentName - The name of the period of time when the recording takes place.
     * Special characters are not allowed.
     * @param options - The options for how to record the video.
     * {@link DefaultStartVideoCaptureOptions} specifies the default options.
     */
    startVideoCapture(momentName: string, options?: Partial<StartVideoCaptureOptions>): Promise<VideoCaptureResponseCode>;
    /**
     * Stops recording a video from the player's point of view.
     *
     * @remarks
     * To start recording, call the {@link startVideoCapture} method.
     *
     * @param options - The options for how to record the video.
     * {@link DefaultStopVideoCaptureOptions} specifies the default options.
     */
    stopVideoCapture(options?: Partial<StopVideoCaptureOptions>): Promise<VideoCaptureResponseCode>;
}
/**
 * The options for the {@link startVideoCapture} method.
 *
 * @remarks
 * {@link DefaultStartVideoCaptureOptions} specifies the default options.
 */
export declare type StartVideoCaptureOptions = {
    /**
     * Provide the method that the camera will move and track the player.
     * Default is FirstPerson.
     */
    cameraMovementPreset?: CameraMovementPreset;
    /**
     * The duration, in seconds, to continue recording. The default value is
     * 60 seconds. Internally this value is limited to 60 seconds or less.
     */
    duration: number;
    /**
     * true to save the resulting MP4 when finished. false to discard it. The
     * default value is true.
     */
    saveOnDurationReached: boolean;
    /**
     * Provide the notification flags to show after recording completes.
     */
    notifications: VideoCaptureNotifications;
};
/**
 * The options for the {@link stopVideoCapture} method.
 *
 * @remarks
 * {@link DefaultStopVideoCaptureOptions} specifies the default options.
 */
export declare type StopVideoCaptureOptions = {
    /**
     * true to save the resulting MP4 when finished. false to discard it. The
     * default value is true.
     */
    save: boolean;
};
/**
 * The response codes for {@link PlayerCapturing} functions.
 *
 * @privateRemarks
 * Must remain in sync with VideoCaptureResponseCode in IScriptingRuntime.cs.
 */
export declare enum VideoCaptureResponseCode {
    /**
     * The operation completed without an error.
     */
    Success = 0,
    /**
     * An exception that produced an internal code occured. It was not caused by the caller.
     */
    InternalError = 1,
    /**
     * The user turned off storage permission on the device so the device can't save video files.
     */
    StoragePermissionDenied = 2,
    /**
     * The {@link startVideoCapture} call failed because another recording is already in progress.
     */
    RecordingAlreadyInProgress = 3,
    /**
     * The {@link stopVideoCapture} call failed because no recording was in progress.
     */
    RecordingNotInProgress = 4,
    /**
     * Auto capture is disabled by the user.
     */
    FeatureDisabled = 5,
    /**
     * The parameters are invalid. The string may include special characters.
     *
     * @deprecated Use the InvalidParameter response code instead.
     */
    InvalidParamter = 6,
    /**
     * The parameters are invalid. The string may include special characters.
     */
    InvalidParameter = 6,
    /**
     * The {@link startVideoCapture} call failed due to the user reaching the maximum
     * number of saved recordings per session (10 videos).
     */
    MaxRecordingReachedFailure = 7
}

}