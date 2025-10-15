import * as Hz from 'horizon/core';
import { View, Text } from 'horizon/ui';

class ErrorTestScript extends Hz.Component<typeof ErrorTestScript> {
    static propsDefinition = {};

    preStart() {
        logWithTimestamp("❌ ErrorTestScript starting - will generate CustomUI errors");
    }
 
    start() {
        
        // Create a panel that will trigger the error
        const panel = this.world.ui.createCustomUIPanel({
            entity: this.entity,
            updateFrequency: 'low'
        });

        // Set content that will cause the error
        panel.rootUINode = this.render();
    }

    render() {
        
        // This will cause: Prop 'children' of View component must be a UINode, an array of UINodes, or undefined
        // We're passing a string directly instead of wrapping it in Text
        return View({
            children: "This is invalid - strings must be wrapped in Text!" as any
        });
    }
}

Hz.Component.register(ErrorTestScript);
