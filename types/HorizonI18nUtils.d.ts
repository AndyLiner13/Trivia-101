declare module 'HorizonI18nUtils' {
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */
/**
 * Representation of a LocalizableText.
 * Codifies the format and arguments of a piece of text we will
 * transmit over the wire and materialize a translation on the client.
 * Format: [hashkey, english template, params].
 * Internal usage only.
 */
export declare type LocalizableTextRepresentation = [string, string, LocalizableTextParamsRepresentation];
/**
 * Params map representation. Name to value.
 * Internal usage only.
 */
export declare type LocalizableTextParamsRepresentation = {
    [key: string]: string | LocalizableTextRepresentation;
};
/**
 * Unmaterialized localizable text. It does not contain the translation,
 * but it has enough information to translate in each player's locale
 * before rendering. Usually, this is the return of an fbt call.
 */
export declare class LocalizableText {
}
/**
 * Check if the string is a serialized representation of a LocalizableText.
 * Internal usage only.
 */
export declare function isLocalizableTextSerializedRepresentation(str: string): boolean;
/**
 * Creates a LocalizableText from the serialized representation (string).
 * Internal usage only.
 */
export declare function getLocalizableTextFromSerializedRepresentation(serializedRepresentation: string): LocalizableText;
/**
 * Returns the format and arguments of a piece of text we will
 * transmit over the wire and materialize a translation on the client.
 * Internal usage only.
 */
export declare function getLocalizableTextSerializedRepresentation(text: LocalizableText): string;
/**
 * Proxy to LocalizableText constructor.
 * Internal usage only.
 */
export declare function getLocalizableTextFromRepresentation(representation: LocalizableTextRepresentation): LocalizableText;
/**
 * Proxy to LocalizableText internal member variable.
 * Internal usage only.
 */
export declare function getLocalizableTextRepresentation(text: LocalizableText): LocalizableTextRepresentation;
/**
 * Materializes a LocalizableText serialized representation into the translation
 * of the current local player.
 * Internal usage only.
 */
export declare function getLocalizableTextTranslationForLocalPlayer(serializedRepresentation: string): string;
/**
 * Get serialized representation of a text if it is a LocalizableText object.
 * Otherwise, it just returns the text passed.
 * Internal usage only.
 */
export declare function serializedIfLocalizableText(text: string | LocalizableText): string;

}