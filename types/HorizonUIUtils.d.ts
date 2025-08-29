declare module 'HorizonUIUtils' {
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * This file is generated, it should not be modified.
 * To update this file, run `yarn gulp customui:gen`
 *
 * @generated SignedSource<<ab6fa61d4f5e00ae7af9d6ec71f5aa61>>
 */
import type { UINode, ConditionalProps, ViewProps, TextProps, ImageProps, PressableProps, ScrollViewProps, DynamicListProps, DynamicListImplProps } from 'horizon/ui';
import type { EditorButtonProps, EditorTextProps, EditorTextInputProps } from 'horizon/editor';
export declare type ComponentMap = {
    Conditional: ConditionalProps;
    View: ViewProps;
    Text: TextProps;
    Image: ImageProps;
    Pressable: PressableProps;
    ScrollView: ScrollViewProps;
    DynamicList: DynamicListProps<any>;
    DynamicListImpl: DynamicListImplProps<any>;
    EditorButton: EditorButtonProps;
    EditorText: EditorTextProps;
    EditorTextInput: EditorTextInputProps;
};
export declare function minifyNode(node: UINode): {
    [key: string]: unknown;
};

}