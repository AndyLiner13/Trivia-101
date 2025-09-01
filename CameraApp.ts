import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';

class CameraApp extends ui.UIComponent<typeof CameraApp> {
  static propsDefinition = {};

  // App state management
  private currentAppBinding = new ui.Binding('home');
  private isCameraAppBinding = new ui.Binding(false);
  private isRecordingBinding = new ui.Binding(false);
  private recordingTimeBinding = new ui.Binding(0);
  
  // Internal state
  private recordingInterval: any = null;
  private recordingTime = 0;
  private recordingTracker: any = null;

  initializeUI(): ui.UINode {
    return ui.UINode.if(
      this.isCameraAppBinding,
      this.renderFullScreenCameraApp(),
      this.renderPhoneFrame()
    );
  }

  start() {
    super.start();
  }

  // Handle camera input (simplified for now)
  private handleCameraInput(interactionInfo: any): void {
    console.log('Processing camera input for POV control...');
    // In a real implementation, this would translate touch/mouse input 
    // to camera rotation and movement
  }

  // Camera mode methods
  private async enterCameraMode(): Promise<void> {
    console.log('Entering camera mode...');
    
    // Get the local player
    const localPlayer = this.world.getLocalPlayer();
    
    if (localPlayer) {
      try {
        // Switch to full-screen camera UI first
        this.isCameraAppBinding.set(true);
        this.currentAppBinding.set('camera');
        
        // Enter focused interaction mode for direct camera control
        localPlayer.enterFocusedInteractionMode({
          disableFocusExitButton: true // Disable the default exit button since we have our own
        });
        
        // Don't focus the UI on this component as it blocks the view
        // Instead, let the player have free camera movement
        
        console.log('Camera mode activated - Free POV camera control enabled');
        console.log('Use touch/mouse to look around, use the exit button to return');
      } catch (error) {
        console.error('Failed to enter camera mode:', error);
      }
    } else {
      // Fallback if no local player found
      this.isCameraAppBinding.set(true);
      this.currentAppBinding.set('camera');
    }
  }

  private exitCameraMode(): void {
    console.log('Exiting camera mode...');
    
    // Get the local player
    const localPlayer = this.world.getLocalPlayer();
    
    if (localPlayer) {
      try {
        // Exit focused interaction mode
        localPlayer.exitFocusedInteractionMode();
        
        // Remove UI focus (if any was applied)
        localPlayer.unfocusUI();
        
        console.log('Camera mode deactivated - Normal controls restored');
      } catch (error) {
        console.error('Failed to exit camera mode:', error);
      }
    }
    
    // Stop any recording
    this.stopRecording();
    
    // Return to home screen
    this.isCameraAppBinding.set(false);
    this.currentAppBinding.set('home');
  }

  private renderPhoneFrame(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
      },
      children: [
        // Phone container
        ui.View({
          style: {
            width: 200,
            height: 400,
            backgroundColor: '#000000', // Black phone frame
            borderRadius: 20,
            padding: 6,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            // Phone screen content area
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                overflow: 'hidden'
              },
              children: [
                this.renderHomeScreen()
              ]
            })
          ]
        })
      ]
    });
  }

  private renderHomeScreen(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        gradientColorA: '#60A5FA', // blue-400
        gradientColorB: '#2563EB', // blue-600
        gradientAngle: '180deg', // top to bottom gradient
        borderRadius: 14, // Match the screen border radius
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: '10%',
        paddingRight: '10%',
        overflow: 'hidden' // Ensure gradient doesn't bleed
      },
      children: [
        // App Grid Container - 2x3 grid layout like reference
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            paddingTop: 16,
            paddingBottom: 16
          },
          children: [
            // First row of apps
            ui.View({
              style: {
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                flex: 1
              },
              children: [
                this.createAppIcon('Phone', '#00c951', BigInt("24322726084045822")),
                this.createAppIcon('Calculator', '#2b7fff', BigInt("2175040452971461"))
              ]
            }),
            
            // Second row of apps
            ui.View({
              style: {
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                flex: 1
              },
              children: [
                this.createAppIcon('Contacts', '#ff6900', BigInt("1328787472168292")),
                this.createAppIcon('Camera', '#34d399', BigInt("1342398257464986")) // Changed from MeMail to Camera with green color
              ]
            }),
            
            // Third row of apps
            ui.View({
              style: {
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                flex: 1
              },
              children: [
                this.createAppIcon('Browser', '#ad46ff', BigInt("592774970456232")),
                this.createAppIcon('Settings', '#6a7282', BigInt("1342398257464986"))
              ]
            })
          ]
        })
      ]
    });
  }

  private createAppIcon(appName: string, color: string, assetId: bigint): ui.UINode {
    return ui.Pressable({
      style: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        height: '100%'
      },
      onPress: () => {
        if (appName === 'Camera') {
          // Switch to full-screen camera mode and enter camera POV
          this.enterCameraMode();
        } else {
          // Visual only - no app switching functionality for other apps
          console.log(`${appName} icon pressed - visual only`);
        }
      },
      children: [
        // App icon background
        ui.View({
          style: {
            width: 68,
            height: 68,
            backgroundColor: color,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 4
          },
          children: [
            // App icon symbol
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(assetId)),
              style: {
                width: 34,
                height: 34,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),
        
        // App name label
        ui.Text({
          text: appName,
          style: {
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '500',
            textAlign: 'center'
          }
        })
      ]
    });
  }

  // Full-screen horizontal camera interface
  private renderFullScreenCameraApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center'
      },
      children: [
        // Camera viewfinder (transparent to show world)
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent', // Make transparent to see the world
            position: 'relative'
          },
          children: [
            // Camera overlay UI
            ui.View({
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10
              },
              children: [
                // Top controls bar
                ui.View({
                  style: {
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    right: 20,
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                  },
                  children: [
                    // Recording indicator/timer
                    ui.UINode.if(
                      this.isRecordingBinding,
                      ui.View({
                        style: {
                          backgroundColor: 'rgba(220, 38, 38, 0.9)',
                          borderRadius: 15,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          flexDirection: 'row',
                          alignItems: 'center'
                        },
                        children: [
                          ui.View({
                            style: {
                              width: 8,
                              height: 8,
                              backgroundColor: '#FFFFFF',
                              borderRadius: 4,
                              marginRight: 6
                            }
                          }),
                          ui.Text({
                            text: ui.Binding.derive([this.recordingTimeBinding], (time) => this.formatRecordingTime(time)),
                            style: {
                              color: '#FFFFFF',
                              fontSize: 14,
                              fontWeight: '500'
                            }
                          })
                        ]
                      })
                    )
                  ]
                }),

                // Center crosshair/focus indicator
                ui.View({
                  style: {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: [{ translateX: -25 }, { translateY: -25 }],
                    width: 50,
                    height: 50,
                    borderWidth: 2,
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: 25
                  }
                }),

                // Right side record button
                ui.View({
                  style: {
                    position: 'absolute',
                    right: 40,
                    top: '50%',
                    transform: [{ translateY: -40 }],
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  children: [
                    // Record button
                    ui.Pressable({
                      style: {
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: ui.Binding.derive([this.isRecordingBinding], (recording) => 
                          recording ? '#dc2626' : '#FFFFFF'
                        ),
                        borderWidth: 4,
                        borderColor: '#FFFFFF',
                        justifyContent: 'center',
                        alignItems: 'center'
                      },
                      onPress: () => {
                        this.toggleRecording();
                      },
                      children: [
                        ui.UINode.if(
                          this.isRecordingBinding,
                          // Stop icon (square)
                          ui.View({
                            style: {
                              width: 20,
                              height: 20,
                              backgroundColor: '#FFFFFF',
                              borderRadius: 2
                            }
                          }),
                          // Record icon (circle)
                          ui.View({
                            style: {
                              width: 24,
                              height: 24,
                              backgroundColor: '#dc2626',
                              borderRadius: 12
                            }
                          })
                        )
                      ]
                    })
                  ]
                }),

                // Bottom left exit button
                ui.View({
                  style: {
                    position: 'absolute',
                    bottom: 40,
                    left: 40,
                    alignItems: 'center'
                  },
                  children: [
                    // Exit button
                    ui.Pressable({
                      style: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        borderRadius: 25,
                        width: 50,
                        height: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: 'rgba(255, 255, 255, 0.3)'
                      },
                      onPress: () => {
                        this.exitCameraMode();
                      },
                      children: [
                        ui.Text({
                          text: '✕',
                          style: {
                            color: '#FFFFFF',
                            fontSize: 20,
                            fontWeight: 'bold'
                          }
                        })
                      ]
                    })
                  ]
                }),

                // Camera mode text
                ui.View({
                  style: {
                    position: 'absolute',
                    bottom: 110,
                    left: 0,
                    right: 0,
                    alignItems: 'center'
                  },
                  children: [
                    ui.Text({
                      text: 'POV Camera Mode - Touch to Look Around',
                      style: {
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: 16,
                        fontWeight: '500',
                        textAlign: 'center'
                      }
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  // Helper methods
  private toggleRecording(): void {
    // Check if currently recording using interval reference
    const currentlyRecording = this.recordingInterval !== null;
    
    if (currentlyRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private startRecording(): void {
    console.log('Starting POV camera recording...');
    this.isRecordingBinding.set(true);
    this.recordingTime = 0;
    this.recordingTimeBinding.set(0);
    
    // Use Horizon's async utility for timing
    this.recordingInterval = this.async.setInterval(() => {
      this.recordingTime += 1;
      this.recordingTimeBinding.set(this.recordingTime);
    }, 1000);
    
    // Get the local player for camera capture simulation
    const localPlayer = this.world.getLocalPlayer();
    if (localPlayer) {
      console.log('Recording from player POV - Camera position:', localPlayer.head.position);
      console.log('Recording from player POV - Camera rotation:', localPlayer.head.rotation);
      
      // In a real implementation, this would start actual camera capture
      // For now we simulate the recording with enhanced player tracking
      this.simulateCameraRecording(localPlayer);
    }
  }

  private simulateCameraRecording(player: hz.Player): void {
    console.log('Simulating camera recording from player POV...');
    
    // Listen for OnCameraPhotoTaken events if they occur during recording
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnCameraPhotoTaken, (capturePlayer, isSelfie) => {
      if (capturePlayer === player) {
        console.log('Camera photo captured during recording session!');
      }
    });
    
    // Simulate continuous POV recording by logging camera data
    const recordingTracker = this.async.setInterval(() => {
      // Check if still recording by checking the interval
      if (this.recordingInterval !== null) {
        const headPos = player.head.position.get();
        const headRot = player.head.rotation.get();
        console.log(`Recording frame - Position: ${headPos.toString()}, Rotation: ${headRot.toString()}`);
      }
    }, 1000); // Log every second during recording
    
    // Store the tracking interval so we can clean it up
    this.recordingTracker = recordingTracker;
  }

  private async updateRecordingTimer(): Promise<void> {
    // This method is no longer needed with setInterval approach
  }

  private stopRecording(): void {
    console.log('Stopping POV camera recording...');
    this.isRecordingBinding.set(false);
    
    if (this.recordingInterval) {
      this.async.clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
    
    if (this.recordingTracker) {
      this.async.clearInterval(this.recordingTracker);
      this.recordingTracker = null;
    }
    
    this.recordingTime = 0;
    this.recordingTimeBinding.set(0);
    
    // In a real implementation, this would save the recorded video
    console.log('POV recording saved! Camera tracking stopped.');
  }

  private formatRecordingTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

hz.Component.register(CameraApp);
