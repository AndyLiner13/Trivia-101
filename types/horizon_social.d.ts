declare module 'horizon/social' {
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */
import { Player } from 'horizon/core';
import { ImageSource } from 'horizon/ui';
/**
 * The name of the API.
 */
export declare const ApiName = "Social";
/**
 * Represents options that can be used when creating an Avatar image component.
 */
export interface IAvatarImageOptions {
    readonly type: AvatarImageType;
    highRes?: boolean;
    skuOverrides?: Array<string>;
}
/**
 * Represents the different types of avatar images that can be used by an image component.
 */
export declare enum AvatarImageType {
    /**
     * LowRes - 256x512 pixel image of the player's full avatar.
     *
     * HighRes - 512x1024 pixel image of the player's full avatar. (Default)
     *
     * @remarks Includes a margin around the avatar.
     */
    FULL = 0,
    /**
     * LowRes - 64x64 pixel image of the player's avatar headshot.
     * Ideal for small UI elements. (e.g. small profile icons)
     *
     * HighRes - 288x288 pixel image of the player's avatar headshot. (Default)
     * Ideal for large UI elements. (e.g. large profile icons)
     */
    HEADSHOT = 1
}
/**
 * Represents the different types of follow status between two players.
 */
export declare enum FollowStatus {
    /**
     * The player is not following the target player
     */
    NOT_FOLLOWING = 0,
    /**
     * The player has sent a follow request to the target player
     */
    PENDING_FOLLOW = 1,
    /**
     * The player is following the target player
     */
    FOLLOWING = 2,
    /**
     * The player and the target player are following each other
     */
    MUTUAL_FOLLOWING = 3
}
/**
 * Manages the friend system and related social functionality between players in a world.
 *
 * @remarks
 * You can use this class to send follow requests between players and get follower and following
 * counts for distributing achievements and rewards based on the level of engagement between players
 * in your world.
 *
 * @example
 * ```
 * private followerLogging(player1: Player, player2: Player) {
 *   // Get the number of followers that the local player has in the current world
 *   Social.getPlayerFollowerCountInWorld(player1).then(count => {
 *     console.log(`Player 1 has ${count} followers in this world.`);
 *   });

 *   // Check whether or not player 1 is following player 2.  Use getFollowingStatus so we can detect pending follow requests
 *   Social.getFollowingStatus(player1, player2).then(status => {
 *     console.log(`Player 1 is ${status.toString()} player 2.`);

 *     // If not following, and we don't have a pending follow request, send an invite
 *     if (status == FollowStatus.NOT_FOLLOWING) {
 *       Social.showFollowRequestModal(player1, player2)
 *     }
 *   });
 * }
 * ```
 */
export declare class Social {
    private static nextEventId;
    private static followersLoadedCallback;
    private static eventSubscription;
    private static world;
    /**
     * Subscribe a callback function to be notified when the local player's followers list is loaded or modified.
     * Note: This callback will not be triggered for a player when a mutual follower unfollows them.
     *
     * @param callback - The function to call when the local player's follower list is loaded or modified.
     * @returns An ID to use to unregister the callback.
     */
    static registerFollowersLoadedEvent(callback: () => void): number;
    /**
     * Unsubscribe a callback for follower notification using the value returned by registerFollowersLoadedEvent.
     *
     * @param eventId - The callback ID returned from registerFollowersLoadedEvent.
     */
    static removeFollowersLoadedEvent(eventId: number): void;
    /**
     * Gets the total number of players that are following the given player in the world.
     * Note: There can be a delay of up to 12 seconds (or longer) between when a player follows another player and when the count is updated.
     * This method may return an unexpected value if the player is in multiple worlds at the same time, including the horizon editor.
     *
     * @remarks This method is not supported on server scripts. Please change script execution mode to local.
     *
     * @param player - The player to retrieve the follower count for.
     * @returns A promise that resolves to the number of retrieved followers.
     */
    static getPlayerFollowerCountInWorld(player: Player): Promise<number>;
    /**
     * Gets the total number of players the given player is following in the world.
     * Note: There can be a delay of up to 12 seconds (or longer) between when a player follows another player and when the count is updated.
     * This method may return an unexpected value if the player is in multiple worlds at the same time, including the horizon editor.
     *
     * @remarks This method is not supported on server scripts. Please change script execution mode to local.
     *
     * @param player - The player to retrieve the following count for.
     * @returns A promise that resolves to the number of players the given player is following in the world.
     */
    static getPlayerFollowingCountInWorld(player: Player): Promise<number>;
    /**
     * Checks if two players are following each other in Meta Horizon Worlds.
     *
     * @remarks
     * This is a convenience method that indicates whether isPlayerFollowing is true for both players.
     * This method is not supported on server scripts. Please change script execution mode to local.
     *
     * @param player1 - The first player to check.
     * @param player2 - The second player to check.
     * @returns A promise that resolves to true if both players are following each other; false otherwise.
     * @throws Throws a `TypeError` exception if the input is not a valid {@link core#Player} object.
     */
    static areMutuallyFollowing(player1: Player, player2: Player): Promise<boolean>;
    /**
     * Checks if the given player is following the target player in Meta Horizon Worlds.
     *
     * @remarks This method is not supported on server scripts. Please change script execution mode to local.
     *
     * @param requestor - The player that's the potenial follower of the target player.
     * @param following - The target player that is potentially being followed.
     * @returns A promise that resolves to true if the given player is following the tartget player; false otherwise.
     * @throws Throws a `TypeError` if the input is not a valid {@link core#Player} object.
     */
    static isPlayerFollowing(requestor: Player, following: Player): Promise<boolean>;
    /**
     * Checks the given player's following status for the target player in Meta Horizon Worlds.
     *
     * @remarks This method is not supported on server scripts. Please change script execution mode to local.
     *
     * @param requestor - The player who you are checking the status for.
     * @param target - The target player that is potentially being followed.
     * @returns A promise that resolves to a FollowStatus enum value describing the current follow status.
     * @throws Throws a `TypeError` if the input is not a valid {@link core#Player} object.
     */
    static getFollowingStatus(requestor: Player, target: Player): Promise<FollowStatus>;
    /**
     * Gets the total number of mutual followers in the world for the given player.
     * Note: There can be a delay of up to 12 seconds (or longer) between when a player follows another player and when the count is updated.
     * This method may return an unexpected value if the player is in multiple worlds at the same time, including the horizon editor.
     *
     * @remarks
     * Mutual followers are players that both follow and are followed by the given player.
     * This method is not supported on server scripts. Please change script execution mode to local.
     *
     * @param player - The player to check the mutual follower count for.
     * @returns A promise that resolves to the number of mutual followers the player has.
     * @throws A `TypeError` is thrown if the input is not a valid {@link core#Player} object.
     */
    static getPlayerMutuallyFollowCountInWorld(player: Player): Promise<number>;
    /**
     * Shows a follow request modal in the UI of the target player.
     *
     * @remarks
     * The modal UI dialog asks the target player if they accept the follow request and prompts
     * them to follow back if they haven't already.
     *
     * @param requestor - The player making the request.
     * @param potentialFollow - The player to follow.
     * @throws A `TypeError` exception is thrown if the input is not a valid {@link core#Player} object.
     */
    static showFollowRequestModal(requestor: Player, potentialFollow: Player): void;
    /**
     * Shows the invite to world friends list UI.
     * @param player - A local player to show the invite to world friends list to.
     */
    static showInvitePlayerList(player: Player): void;
    /**
     * Gets an image based on the player's avatar.
     *
     * @remarks This method is only available in conjunction with the `horizon/ui` API
     * Only works on Client. Make sure your Custom UI panel and script is local.
     *
     * @param Player - The player of the avatar to retrieve.
     * @param AvatarImageOptions - Avatar options for the image.
     * @returns The avatar image source for the given player.
     * @example
     * Local Player:
     * ```
     *import {
     *    Color,
     *  } from "horizon/core";
     *import { Social } from "horizon/social";
     *import {
     *  UIComponent,
     *  View,
     *  Image,
     *  ImageSource,
     *  Binding,
     *} from "horizon/ui";
  
     *class PlayerIcon extends UIComponent<typeof PlayerIcon> {
     *  static propsDefinition = {};
     *    panelHeight = 88;
     *    panelWidth = 88;
     *    private _image!: Binding<ImageSource>;
     *
     *  async start() {
     *    this._image.set(await Social.getAvatarImageSource(this.world.getLocalPlayer()));
     *  }
     *
     *  initializeUI() {
     *    this.initializeBindings();
     *    var iconStyle = {
     *      height: this.panelHeight,
     *      width: this.panelWidth,
     *      borderRadius: this.panelWidth/2,
     *      borderWidth: 2,
     *      borderColor: Color.white,
     *      backgroundColor: Color.fromHex("#99b4e2")
     *    };
     *
     *   return View({
     *      children: [
     *        Image({
     *          source: this._image,
     *          style: iconStyle,
     *        }),
     *      ],
     *      style: { backgroundColor: "transparent", position: "absolute", bottom: 10, right: 10 },
     *    });
     *  }
     *
     *  initializeBindings() {
     *    this._image = new Binding<ImageSource>(new ImageSource());
     *  }
     *}
     *
     * UIComponent.register(PlayerIcon);
     * ```
     *
     * @example
     * Network Player: Get Avatar for closest player in front of you, remove avatar when player is out of proximity
     * ```
     *  async start() {
     *    this.connectNetworkEvent(this.world.getLocalPlayer(), Events.playerProximityEvent, async (data: {player: Player}) => {
     *     this.visible.set(data.player != undefined)
     *     if (data.player)
     *     {
     *       this._image.set(await Social.getAvatarImageSource(data.player));
     *     }
     *   })
     *
     *   this.connectNetworkEvent(this.world.getLocalPlayer(), Events.noProximityEvent, async (data) => {
     *     this.visible.set(false)
     *     this._image.set(new Binding<ImageSource>(new ImageSource()));
     *   })
     *  }
     * ```
     */
    static getAvatarImageSource(player: Player, options?: IAvatarImageOptions): Promise<ImageSource>;
    private static isRunningOnServer;
}

}