import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import LocalCamera, { CameraTransitionOptions, Easing } from 'horizon/camera';

export class CameraOverlay extends ui.UIComponent<typeof CameraOverlay> {
    static componentName = "CameraOverlay";
    static local = true; // Must be local for camera overlay
    
    static propsDefinition = {
        // No additional props needed for overlay
    };

    // Bindings for reactive UI state
    private isActiveBinding = new ui.Binding(false);
    private isFlashOnBinding = new ui.Binding(false);
    private isRearCameraBinding = new ui.Binding(true);
    private isRecordingBinding = new ui.Binding(false);

    // Internal state
    private cameraPosition: hz.Vec3 | null = null;
    private isInCameraMode = false;
    private isFlashOn = false;
    private isRearCamera = true;

    public start(): void {
        super.start();
        console.log('Camera overlay initialized');
    }

    initializeUI(): ui.UINode {
        return ui.View({
            style: {
                width: "100vw",
                height: "100vh",
                backgroundColor: 'transparent',
                margin: 0,
                padding: 0
            },
            children: [
                // Only show overlay when active
                ui.UINode.if(this.isActiveBinding, this.renderCameraOverlay())
            ]
        });
    }

    private renderCameraOverlay(): ui.UINode {
        return ui.View({
            style: {
                width: "100vw",
                height: "100vh",
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                margin: 0,
                padding: 0
            },
            children: [
                // Top controls bar
                ui.View({
                    style: {
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        right: 20,
                        height: 80,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingHorizontal: 20
                    },
                    children: [
                        // Close button
                        ui.Pressable({
                            style: {
                                width: 60,
                                height: 60,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: 30,
                                justifyContent: 'center',
                                alignItems: 'center'
                            },
                            onPress: () => this.closeCamera(),
                            children: [
                                ui.Text({
                                    text: '✕',
                                    style: {
                                        color: '#FFFFFF',
                                        fontSize: 24,
                                        fontWeight: 'bold'
                                    }
                                })
                            ]
                        }),

                        // Flash button
                        ui.Pressable({
                            style: {
                                width: 60,
                                height: 60,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: 30,
                                justifyContent: 'center',
                                alignItems: 'center'
                            },
                            onPress: () => this.toggleFlash(),
                            children: [
                                ui.Text({
                                    text: '⚡',
                                    style: {
                                        color: ui.Binding.derive([this.isFlashOnBinding], (isOn) => 
                                            isOn ? '#FFFF00' : '#FFFFFF'
                                        ),
                                        fontSize: 24
                                    }
                                })
                            ]
                        }),

                        // Switch camera button
                        ui.Pressable({
                            style: {
                                width: 60,
                                height: 60,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: 30,
                                justifyContent: 'center',
                                alignItems: 'center'
                            },
                            onPress: () => this.switchCamera(),
                            children: [
                                ui.Text({
                                    text: '🔄',
                                    style: {
                                        color: '#FFFFFF',
                                        fontSize: 24
                                    }
                                })
                            ]
                        })
                    ]
                }),

                // Center viewfinder area with crosshair
                ui.View({
                    style: {
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: [{ translateX: -50 }, { translateY: -50 }],
                        width: 100,
                        height: 100,
                        borderWidth: 2,
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: 50,
                        backgroundColor: 'transparent'
                    }
                }),

                // Bottom controls bar
                ui.View({
                    style: {
                        position: 'absolute',
                        bottom: 40,
                        left: 20,
                        right: 20,
                        height: 100,
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                        alignItems: 'center'
                    },
                    children: [
                        // Gallery button
                        ui.Pressable({
                            style: {
                                width: 60,
                                height: 60,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: 30,
                                justifyContent: 'center',
                                alignItems: 'center'
                            },
                            onPress: () => this.openGallery(),
                            children: [
                                ui.Text({
                                    text: '📷',
                                    style: {
                                        fontSize: 24
                                    }
                                })
                            ]
                        }),

                        // Capture button (large, center)
                        ui.Pressable({
                            style: {
                                width: 80,
                                height: 80,
                                backgroundColor: '#FFFFFF',
                                borderRadius: 40,
                                borderWidth: 4,
                                borderColor: 'rgba(200, 200, 200, 1)',
                                justifyContent: 'center',
                                alignItems: 'center'
                            },
                            onPress: () => this.capturePhoto(),
                            children: [
                                ui.View({
                                    style: {
                                        width: 60,
                                        height: 60,
                                        backgroundColor: ui.Binding.derive([this.isRecordingBinding], (recording) =>
                                            recording ? '#dc2626' : '#FFFFFF'
                                        ),
                                        borderRadius: 30
                                    }
                                })
                            ]
                        }),

                        // Mode button
                        ui.Pressable({
                            style: {
                                width: 60,
                                height: 60,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: 30,
                                justifyContent: 'center',
                                alignItems: 'center'
                            },
                            onPress: () => console.log('Mode button pressed'),
                            children: [
                                ui.Text({
                                    text: '📐',
                                    style: {
                                        fontSize: 24
                                    }
                                })
                            ]
                        })
                    ]
                }),

                // Camera mode indicator
                ui.View({
                    style: {
                        position: 'absolute',
                        bottom: 160,
                        left: 0,
                        right: 0,
                        alignItems: 'center'
                    },
                    children: [
                        ui.Text({
                            text: 'Camera Overlay Mode',
                            style: {
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: 16,
                                fontWeight: 'bold',
                                textAlign: 'center'
                            }
                        })
                    ]
                })
            ]
        });
    }

    public openCamera(): void {
        console.log("Opening camera overlay");
        this.isActiveBinding.set(true);
        this.initializeCamera();
    }

    public closeCamera(): void {
        console.log("Closing camera overlay");
        this.isActiveBinding.set(false);
        this.deinitializeCamera();
    }

    private initializeCamera(): void {
        try {
            // Initialize camera settings
            const localPlayer = this.world.getLocalPlayer();
            if (localPlayer) {
                // Enter focused interaction mode for overlay
                localPlayer.enterFocusedInteractionMode({
                    disableFocusExitButton: true
                });
                
                console.log("Camera overlay initialized");
            }
        } catch (error) {
            console.error("Failed to initialize camera:", error);
        }
    }

    private deinitializeCamera(): void {
        try {
            // Clean up camera settings
            const localPlayer = this.world.getLocalPlayer();
            if (localPlayer) {
                // Exit focused interaction mode
                localPlayer.exitFocusedInteractionMode();
                
                console.log("Camera overlay deinitialized");
            }
        } catch (error) {
            console.error("Failed to deinitialize camera:", error);
        }
    }

    private capturePhoto(): void {
        try {
            // Create flash effect
            this.animateCaptureFlash();
            
            console.log("Photo captured");
            
            // Optional: Close overlay after capture
            this.async.setTimeout(() => {
                this.closeCamera();
            }, 500);
            
        } catch (error) {
            console.error("Failed to capture photo:", error);
        }
    }

    private animateCaptureFlash(): void {
        // Create a brief white flash effect by temporarily changing background
        const originalBg = 'rgba(0, 0, 0, 0.8)';
        
        // This would require a binding to work properly in a real implementation
        console.log("Flash effect triggered");
    }

    private toggleFlash(): void {
        this.isFlashOn = !this.isFlashOn;
        this.isFlashOnBinding.set(this.isFlashOn);
        
        console.log(`Flash ${this.isFlashOn ? 'enabled' : 'disabled'}`);
    }

    private switchCamera(): void {
        this.isRearCamera = !this.isRearCamera;
        this.isRearCameraBinding.set(this.isRearCamera);
        
        console.log(`Switched to ${this.isRearCamera ? 'rear' : 'front'} camera`);
    }

    private openGallery(): void {
        console.log("Opening gallery...");
        // This could open a gallery overlay or navigate to a photos app
    }

    public isOverlayActive(): boolean {
        return this.isActiveBinding ? true : false;
    }
}

// Register the component
hz.Component.register(CameraOverlay);
