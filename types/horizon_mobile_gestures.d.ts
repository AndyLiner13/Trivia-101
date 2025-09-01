declare module 'horizon/mobile_gestures' {
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */
import { Component, EventSubscription, InteractionInfo, LocalEvent, Vec3 } from 'horizon/core';
/**
 * The name of the API.
 */
export declare const ApiName = "mobile_gestures";
/**
 * Extends an ${@link InteractionInfo}
 */
export declare type TouchInfo = InteractionInfo & {
    /**
     * When did the touch happen?
     * in milliseconds since the epoch, like {@link Date.now}
     */
    time: number;
};
/**
 * Which phase is the touch in
 */
export declare type TouchPhase = 'start' | 'move' | 'end';
/**
 * For swipe events, which direction did it go
 */
export declare enum SwipeDirection {
    None = "none",
    Up = "up",
    Down = "down",
    Left = "left",
    Right = "right"
}
/**
 * State of a touch
 */
export declare type TouchState = {
    phase: TouchPhase;
    /**
     * State when the touch started
     */
    start: TouchInfo;
    /**
     * State during the previous frame
     */
    previous: TouchInfo;
    /**
     * State this current frame
     */
    current: TouchInfo;
    /**
     * How far has it moved this frame?
     */
    screenDelta: Vec3;
    /**
     * How far has it moved overall?
     */
    screenTraveled: number;
};
/**
 * List of touches involved in a gesture
 */
export declare type TouchEventData = {
    touches: TouchState[];
};
/**
 * Payload received by tap events
 */
export declare type TapEventData = TouchEventData;
/**
 * Payload received by long tap events
 */
export declare type LongTapEventData = TouchEventData;
/**
 * Payload received by swipe events
 */
export declare type SwipeEventData = TouchEventData & {
    swipeDirection: SwipeDirection;
};
/**
 * Payload received by pan events
 */
export declare type PanEventData = TouchEventData & {
    /**
     * How far to pan, in screen space
     */
    pan: Vec3;
};
/**
 * Payload received by pinch events
 */
export declare type PinchEventData = TouchEventData & {
    scale: number;
    /**
     * How much to rotate, in radians
     */
    rotate: number;
};
/**
 * Options for gestures detection
 */
export declare class GesturesOptions {
    /**
     * How far a tap must move before it is cancelled or becomes a swipe, in screen space
     * @defaultValue 0.05
     */
    tapScreenThreshold: number;
    /**
     * How long a tap must be held before it is cancelled, in milliseconds
     * @defaultValue 200
     */
    tapTimeThresholdMs: number;
    /**
     * How long a swipe must be held before it is cancelled, in milliseconds
     * @defaultValue 600
     */
    swipeTimeThresholdMs: number;
    /**
     * How long a touch must be held to trigger a long tap, in milliseconds
     * @defaultValue 800
     */
    longTapTimeThresholdMs: number;
}
/**
 * Generic gesture event
 */
export declare class GestureEvent<T extends TouchEventData> extends LocalEvent<T> {
    connectLocalEvent(callback: (payload: T) => void): EventSubscription;
}
/**
 * Detects gestures
 *
 * @example
 * ```
 * import { Gestures } from 'horizon/mobile_gestures';
 *
 * class MyComponent extends Component {
 *   gestures = new Gestures(this);
 *
 *   start() {
 *     const player = this.entity.owner.get();
 *     player.enterFocusedInteractionMode();
 *
 *     this.gestures.onTap.connectLocalEvent(({ touches }) => {
 *       console.log('tap', touches[0].current.screenPosition);
 *     });
 *     this.gestures.onLongTap.connectLocalEvent(({ touches }) => {
 *       console.log('long tap', touches[0].current.screenPosition);
 *     });
 *     this.gestures.onSwipe.connectLocalEvent(({ swipeDirection }) => {
 *       console.log('swipe', swipeDirection);
 *     });
 *     this.gestures.onPinch.connectLocalEvent(({ scale, rotate }) => {
 *       console.log('pinch', scale, rotate);
 *     });
 *   }
 * }
 * ```
 */
export declare class Gestures {
    /**
     * Connect to this event for tap gestures.
     * See {@link Gestures} for example usage.
     */
    onTap: GestureEvent<TapEventData>;
    /**
     * Connect to this event for long tap gestures.
     * See {@link Gestures} for example usage.
     */
    onLongTap: GestureEvent<LongTapEventData>;
    /**
     * Connect to this event for swipe gestures.
     * See {@link Gestures} for example usage.
     */
    onSwipe: GestureEvent<SwipeEventData>;
    /**
     * Connect to this event for pan gestures.
     * See {@link Gestures} for example usage.
     */
    onPan: GestureEvent<PanEventData>;
    /**
     * Connect to this event for pinch gestures.
     * See {@link Gestures} for example usage.
     */
    onPinch: GestureEvent<PinchEventData>;
    /**
     * Creates a Gestures helper
     * @param component - the component to attach to, must be owned by the local player
     * @remarks
     * Requires {@link Player.enterFocusedInteractionMode} to start processing events.
     */
    constructor(component: Component, options?: Partial<GesturesOptions>);
    /**
     * Call this to stop processing events, optional.
     */
    dispose(): void;
}

}