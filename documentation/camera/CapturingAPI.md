# Instant Replay

> **Important**: This feature is not available to all creators. Instant Replay is an experimental feature that allows world creators to add video recording start and stop points to key moments in their world. It records up to 60 seconds of first-person video on behalf of the player who is triggering the moment. This feature enables users to collect and share interesting footage from their gameplay without interrupting the immersive experience.

## How Instant Replay works

1. Worlds that have integrated Instant Replay have a disclaimer for users who join or visit them.

2. When the player explores the world and triggers the START API, recording begins but the player is not notified yet.

3. When the recording finishes, the player receives a pop-up notification inviting them to view the recording.

4. Once the player reviews the video, it is stored locally and removed from the server. The player will need to "review" the video in order to keep it permanently, otherwise it will be deleted after 7 days.

5. Once the player saves the video, it will be treated like any of their other media and can be shared normally.

## How to Add Instant Replay to your World

1. Enable **Generate instant replays** under Player Settings in your world before you publish.

2. Enable the **horizon/capturing** library for TypeScript.

## Experimental camera angles

The instant replay feature records from the avatar's first person point of view by default. Meta Horizon Worlds is running an experiment where creators can choose from the existing first person or two new angle options. For Instant Replays set up with one of the two experimental angles, world visitors in the experiment will trigger Instant Replays with the experimental angle. Visitors not in the experiment won't trigger Instant Replays. 

Recording angle options:
- **Default - First person**: `FirstPersonMovementCameraMovementPreset`
- **Experimental - Third person over the shoulder**: `ThirdPersonOverShoulderCameraMovementPreset`
- **Experimental - Avatar fixed in center of frame**: `FixedPositionTrackingPlayerCameraMovementPreset`

## Examples

### Starting a capture

1. You must specify a unique moment name; we use this for logging and analysis. The moment name must contain only alphanumeric characters and spaces.
2. Duration can be up to 60 seconds.
3. When the duration is reached, you can choose to either save or discard the video, based on the outcome of an action in-game.
   - **Potential scenario**: You have a fishing mechanic and you start recording once a fish is on the hook. If the fish breaks loose you end the recording and discard. If the fish is reeled in, you end the recording and save.
4. You can specify an optional [CameraMovementPreset](https://horizon.meta.com/resources/scripting-api/capturing.cameramovementpreset.md/?api_version=2.0.0) to configure the camera angle.

```typescript
import * as cap from 'horizon/capturing'

let capture = new cap.PlayerCapturing(player.id);
let result = await capture.startVideoCapture("Trigger Test World Moment", {
  CameraMovementPreset: FirstPersonMovementCameraMovementPreset, 
  duration: 15, 
  saveOnDurationReached: false
});
```

### Ending a capture

```typescript
let capture = new cap.PlayerCapturing(player.id);
let result = await capture.stopVideoCapture({save: true});
```

## Tips & Best Practices

- Identify fun or exciting moments in your world that you may want to record for the player. We recommend around one to three spots. Ideally, the spots should be a core part of the gameplay so that players will encounter it naturally. At least one spot should be commonly encountered, while the others could be more rare.
- Sometimes you may want to delay the stop API call a few seconds after the moment "concluded" in order to capture the player reaction.
- You may want to [leverage persistent variables](https://developers.meta.com/horizon-worlds/learn/documentation/typescript/getting-started/persistent-variables-v2) to keep track of when the player has completed a recording to prevent too much duplication.

## Known Issues and Limitations

1. Videos will only record up to 60 seconds.
2. Worlds will limit recording a player to 10 times per session.
3. Videos will not include name tags.
4. While recording, the user may experience a small performance drop due to the extra recording cost. In our testing we noticed about 5 FPS
5. Recording only works on Quest devices. Mobile devices do not support Instant Replay recording at this time.
6. When enabling Instant Replay for the first time if the capture is not successful leave your world and then come back. Your captures should now work as intended.
7. World visitors can opt out of Instant Replay in their settings.

## Additional Resources

- [CameraMovementPreset API Reference](https://horizon.meta.com/resources/scripting-api/capturing.cameramovementpreset.md/?api_version=2.0.0)
- [Persistent Variables Documentation](https://developers.meta.com/horizon-worlds/learn/documentation/typescript/getting-started/persistent-variables-v2)
- [Meta Horizon Worlds Developer Documentation](https://developers.meta.com/horizon-worlds/learn/documentation/)