# Gestures API Documentation

The `mobile_gestures` API allows you to detect and respond to common touch gestures on mobile devices within Horizon Worlds. This tutorial covers how to set up gesture detection, listen for gesture events, and customize gesture behavior. 

## Supported Gestures

The API provides detection for the following gestures:
- **Tap** - Quick touch and release
- **Long Tap** - Extended touch hold
- **Swipe** - Fast directional movement (with direction detection)
- **Pan** - Drag movement across the screen
- **Pinch** - Two-finger scale and rotate gestures

You use the [Gestures](https://developers.meta.com/horizon-worlds/reference/2.0.0/mobile_gestures_gestures) class to listen for these gesture events on a component owned by the local player.

## Step 1: Setup and Initialization

To use the gestures API, you need to:
- Import the [Gestures](https://developers.meta.com/horizon-worlds/reference/2.0.0/mobile_gestures_gestures) class from `horizon/mobile_gestures`
- Create an instance of `Gestures` attached to your component
- Call `enterFocusedInteractionMode()` on the player to start processing gesture events

### Example: Initialization

```typescript
import { Component } from 'horizon/core';
import { Gestures } from 'horizon/mobile_gestures';

class MyComponent extends Component {
  // Create a Gestures instance attached to this component
  gestures = new Gestures(this);

  start() {
    // Get the player who owns this entity
    const player = this.entity.owner.get();
    
    // Enter focused interaction mode to enable gesture event processing
    player.enterFocusedInteractionMode();
    
    // Now you can connect to gesture events (see next section)
  }
}
```

## Step 2: Listening for Gesture Events

The `Gestures` instance exposes the following events you can subscribe to:
- `onTap`
- `onLongTap`
- `onSwipe`
- `onPan`
- `onPinch`

Each event is a [GestureEvent](https://developers.meta.com/horizon-worlds/reference/2.0.0/mobile_gestures_gestureevent) that you connect to with a callback function receiving gesture data.

### Example: Connecting to Gesture Events

This example detects various types of gestures performed on the component and logs the gesture data to the console:

```typescript
// Connect to tap gesture event
this.gestures.onTap.connectLocalEvent(({ touches }) => {
  // Log the screen position of the first touch in the tap gesture
  console.log('Tap detected at:', touches[0].current.screenPosition);
});

// Connect to long tap gesture event
this.gestures.onLongTap.connectLocalEvent(({ touches }) => {
  // Log the screen position of the first touch in the long tap gesture
  console.log('Long tap detected at:', touches[0].current.screenPosition);
});

// Connect to swipe gesture event
this.gestures.onSwipe.connectLocalEvent(({ swipeDirection }) => {
  // Log the direction of the swipe gesture
  console.log('Swipe detected in direction:', swipeDirection);
});

// Connect to pan gesture event
this.gestures.onPan.connectLocalEvent(({ pan }) => {
  // Log the pan delta vector representing movement in screen space
  console.log('Pan detected with delta:', pan);
});

// Connect to pinch gesture event
this.gestures.onPinch.connectLocalEvent(({ scale, rotate }) => {
  // Log the scale factor and rotation (in radians) of the pinch gesture
  console.log('Pinch detected with scale:', scale, 'and rotation:', rotate);
});
```

### Gesture Event Payloads

Each gesture event provides specific data:

| Gesture | Event Data Type | Description |
|---------|----------------|-------------|
| Tap | TapEventData | `touches` array containing TouchState objects |
| Long Tap | LongTapEventData | `touches` array containing TouchState objects |
| Swipe | SwipeEventData | `touches` array, `swipeDirection` enum indicating direction of the swipe (up, down, left, right, or none) |
| Pan | PanEventData | `touches` array, `pan` vector (Vec3) representing the movement delta in screen space |
| Pinch | PinchEventData | `touches` array, `scale` (number), `rotate` (radians) |

#### Touch State Details

Each touch in a `touches` array has the following [state information](https://developers.meta.com/horizon-worlds/reference/2.0.0/mobile_gestures_touchstate):

| Property | Type | Description |
|----------|------|-------------|
| phase | TouchPhase | The current phase of the touch: 'start', 'move', or 'end'. Indicates if the touch just began, is moving, or ended. |
| start | TouchInfo | The state of the touch when it first started. Includes position and timestamp. |
| previous | TouchInfo | The state of the touch during the previous frame. Useful for calculating movement deltas. |
| current | TouchInfo | The state of the touch during the current frame. Contains the latest position and timestamp. |
| screenDelta | Vec3 | The vector representing how far the touch has moved since the previous frame, in screen space. |
| screenTraveled | number | The total distance the touch has moved since it started, accumulated over all frames. |

## Step 3 (Optional): Setting Custom Gesture Detection Thresholds

You can customize gesture detection thresholds by passing [options](https://developers.meta.com/horizon-worlds/reference/2.0.0/mobile_gestures_gesturesoptions) to the `Gestures` constructor:

| Option | Description | Default Value |
|--------|-------------|---------------|
| tapScreenThreshold | How far a tap must move before it is cancelled or becomes a swipe (screen space) | 0.05 |
| tapTimeThresholdMs | How long a tap must be held before it is cancelled (milliseconds) | 200 |
| swipeTimeThresholdMs | How long a swipe must be held before it is cancelled (milliseconds) | 600 |
| longTapTimeThresholdMs | How long a touch must be held to trigger a long tap (milliseconds) | 800 |

### Example: Customizing Gesture Options

```typescript
// Define custom gesture detection options
const options = {
  // Maximum movement allowed for a tap gesture before it is cancelled or becomes a swipe
  tapScreenThreshold: 0.1,
  // Maximum duration (in milliseconds) for a tap gesture
  tapTimeThresholdMs: 300,
  // Minimum duration (in milliseconds) to trigger a long tap gesture
  longTapTimeThresholdMs: 1000,
};

// Create a Gestures instance with custom options
this.gestures = new Gestures(this, options);
```

## Step 4: Lifecycle and Cleanup

If you want to stop processing gesture events, call the `dispose()` method on your `Gestures` instance to disconnect internal event listeners:

```typescript
// Call dispose to stop processing gesture events and clean up listeners
this.gestures.dispose();
```

## Full Example

Here is the full example code from this tutorial, incorporating all the concepts discussed:

```typescript
import { Component } from 'horizon/core';
import { Gestures, SwipeDirection } from 'horizon/mobile_gestures';

class MyComponent extends Component {
  // Declare a Gestures instance variable
  gestures: Gestures;

  start() {
    // Get the player who owns this entity
    const player = this.entity.owner.get();
    
    // Enter focused interaction mode to enable gesture processing
    player.enterFocusedInteractionMode();
    
    // Create a new Gestures instance attached to this component
    this.gestures = new Gestures(this);

    // Listen for tap gestures
    this.gestures.onTap.connectLocalEvent(({ touches }) => {
      // Log the screen position of the first touch in the tap
      console.log('Tap at:', touches[0].current.screenPosition);
    });

    // Listen for long tap gestures
    this.gestures.onLongTap.connectLocalEvent(({ touches }) => {
      // Log the screen position of the first touch in the long tap
      console.log('Long tap at:', touches[0].current.screenPosition);
    });

    // Listen for swipe gestures
    this.gestures.onSwipe.connectLocalEvent(({ swipeDirection }) => {
      // Handle different swipe directions
      switch (swipeDirection) {
        case SwipeDirection.Up:
          console.log('Swipe up detected');
          break;
        case SwipeDirection.Down:
          console.log('Swipe down detected');
          break;
        case SwipeDirection.Left:
          console.log('Swipe left detected');
          break;
        case SwipeDirection.Right:
          console.log('Swipe right detected');
          break;
        default:
          console.log('No swipe direction detected');
      }
    });

    // Listen for pan (drag) gestures
    this.gestures.onPan.connectLocalEvent(({ pan }) => {
      // Log the pan delta vector representing movement in screen space
      console.log('Pan delta:', pan);
    });

    // Listen for pinch gestures (scale and rotate)
    this.gestures.onPinch.connectLocalEvent(({ scale, rotate }) => {
      // Log the scale factor and rotation in radians
      console.log('Pinch scale:', scale, 'rotation:', rotate);
    });
  }

  // Clean up gesture event listeners when the component is destroyed
  onDestroy() {
    this.gestures.dispose();
  }
}
```

## Example Worlds

To see the Gestures API in action, checkout these example worlds:
- [Match3 Example](https://horizon.meta.com/world/10161854210994093/) - Demonstrates the use of tap, long tap, and swipe gestures
- [Maps Example](https://horizon.meta.com/world/10161873353124093/) - Demonstrates the pan and pinch gestures

## Use Cases for Camera Apps

The Gestures API can be particularly useful for camera applications:

### Touch-to-Focus
```typescript
this.gestures.onTap.connectLocalEvent(({ touches }) => {
  const tapPosition = touches[0].current.screenPosition;
  // Set camera focus point based on tap location
  this.setCameraFocus(tapPosition);
});
```

### Pinch-to-Zoom
```typescript
this.gestures.onPinch.connectLocalEvent(({ scale }) => {
  // Adjust camera field of view based on pinch scale
  const currentFOV = LocalCamera.fieldOfView.get();
  const newFOV = currentFOV / scale;
  LocalCamera.overrideCameraFOV(newFOV);
});
```

### Swipe Navigation
```typescript
this.gestures.onSwipe.connectLocalEvent(({ swipeDirection }) => {
  switch (swipeDirection) {
    case SwipeDirection.Left:
      // Switch to next camera mode
      this.nextCameraMode();
      break;
    case SwipeDirection.Right:
      // Switch to previous camera mode
      this.previousCameraMode();
      break;
    case SwipeDirection.Up:
      // Show camera settings
      this.showCameraSettings();
      break;
  }
});
```

### Pan for Camera Movement
```typescript
this.gestures.onPan.connectLocalEvent(({ pan }) => {
  // Move camera position based on pan gesture
  if (this.isInFreeCameraMode) {
    this.moveCameraByDelta(pan);
  }
});
```

## Additional Links
- [Meta home](https://developers.meta.com/horizon-worlds/)
- [Login](https://developers.meta.com/login/?redirect_uri=https%3A%2F%2Fdevelopers.meta.com%2Fhorizon-worlds%2Flearn%2Fdocumentation%2Fcreate-for-web-and-mobile%2Ftypescript-apis-for-mobile%2Fgestures%2F)