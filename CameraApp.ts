import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import LocalCamera, { CameraTransitionOptions, Easing } from 'horizon/camera';

class CameraApp extends ui.UIComponent<typeof CameraApp> {
  static componentName = "CameraApp";
  static local = true; // Set to be a local UI like the working example
  
  static propsDefinition = {
    // Define custom camera controls icons
    cameraControlIcon: { type: hz.PropTypes.Asset },
    movementControlIcon: { type: hz.PropTypes.Asset }
  };

  // App state management
  private currentAppBinding = new ui.Binding('home');
  private isCameraAppBinding = new ui.Binding(false);
  private isRecordingBinding = new ui.Binding(false);
  private recordingTimeBinding = new ui.Binding(0);
  
  // Internal state
  private recordingInterval: any = null;
  private recordingTime = 0;
  private recordingTracker: any = null;
  
  // Camera state
  private originalCameraMode: any = null;
  private cameraPosition: hz.Vec3 | null = null;
  private isInCameraMode = false;
  
  // Input controls
  private lookInputX?: hz.PlayerInput;
  private lookInputY?: hz.PlayerInput;
  private movementInputX?: hz.PlayerInput;
  private movementInputY?: hz.PlayerInput;
  private exitInput?: hz.PlayerInput;
  private inputPollingInterval: any = null;

  initializeUI(): ui.UINode {
    return ui.View({
      style: { 
        width: "100%", 
        height: "100%" 
      },
      children: [
        ui.UINode.if(this.isCameraAppBinding, this.renderFullScreenCameraApp()),
        ui.UINode.if(this.isCameraAppBinding.derive(val => !val), this.renderPhoneFrame())
      ]
    });
  }

  start() {
    super.start();
    
    // Register for player enter world event to set entity ownership
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterWorld,
      player => {
        console.log('Setting entity owner for camera app:', player.id);
        this.entity.owner.set(player);
      }
    );
  }

  // Handle camera input (simplified for now)
  private handleCameraInput(interactionInfo: any): void {
    console.log('Processing camera input for POV control...');
    // In a real implementation, this would translate touch/mouse input 
    // to camera rotation and movement
  }

  // Camera mode methods with proper Camera API
  private async enterCameraMode(): Promise<void> {
    console.log('Entering advanced camera mode...');
    
    // Only proceed if this is running locally (not on server)
    const localPlayer = this.world.getLocalPlayer();
    if (!localPlayer || this.entity.owner.get().id === this.world.getServerPlayer().id) {
      console.log('Camera mode requires local execution');
      return;
    }

    try {
      this.isInCameraMode = true;
      
      console.log('Switching to full-screen camera UI...');
      
      // Switch to full-screen camera UI first
      this.isCameraAppBinding.set(true);
      this.currentAppBinding.set('camera');
      
      // Enter focused interaction mode to take full control of the UI
      localPlayer.enterFocusedInteractionMode({
        disableFocusExitButton: true // We'll handle exit ourselves
      });
      
      // Force UI to focus on this component for full-screen interaction
      localPlayer.focusUI(this.entity);
      
      // Get current player position and calculate camera position 10 meters above
      const playerPosition = localPlayer.head.position.get();
      const cameraPosition = new hz.Vec3(
        playerPosition.x,
        playerPosition.y + 10, // 10 meters above player
        playerPosition.z
      );
      
      // Store the camera position for movement controls
      this.cameraPosition = cameraPosition;
      
      // Look down at the player from above
      const lookAtDirection = cameraPosition.sub(playerPosition).normalize();
      const cameraRotation = hz.Quaternion.lookRotation(lookAtDirection, hz.Vec3.up);
      
      // Set up custom input controls for camera movement
      this.setupCameraInputControls();
      
      // Transition smoothly to fixed camera mode at the elevated position
      const transitionOptions: CameraTransitionOptions = {
        duration: 1.0,
        easing: Easing.EaseInOut
      };
      
      LocalCamera.setCameraModeFixed({
        position: cameraPosition,
        rotation: cameraRotation,
        ...transitionOptions
      });
      
      // Enable camera collision for realistic behavior
      LocalCamera.collisionEnabled.set(true);
      
      // Disable automatic perspective switching since we're in camera mode
      LocalCamera.perspectiveSwitchingEnabled.set(false);
      
      console.log('Camera positioned 10 meters above player at:', cameraPosition.toString());
      console.log('Camera looking at player position:', playerPosition.toString());
      
    } catch (error) {
      console.error('Failed to enter camera mode:', error);
      this.isInCameraMode = false;
    }
  }

  private exitCameraMode(): void {
    console.log('Exiting advanced camera mode...');
    
    const localPlayer = this.world.getLocalPlayer();
    if (!localPlayer || !this.isInCameraMode) {
      return;
    }

    try {
      this.isInCameraMode = false;
      
      // Exit focused interaction mode first
      localPlayer.exitFocusedInteractionMode();
      
      // Unfocus UI
      localPlayer.unfocusUI();
      
      // Cleanup input controls
      this.cleanupCameraInputControls();
      
      // Return to third person camera mode with smooth transition
      const transitionOptions: CameraTransitionOptions = {
        duration: 1.0,
        easing: Easing.EaseInOut
      };
      
      LocalCamera.setCameraModeThirdPerson(transitionOptions);
      
      // Re-enable perspective switching
      LocalCamera.perspectiveSwitchingEnabled.set(true);
      
      // Stop any recording
      this.stopRecording();
      
      console.log('Returned to normal camera mode');
      
    } catch (error) {
      console.error('Failed to exit camera mode:', error);
    }
    
    // Return to home screen
    this.isCameraAppBinding.set(false);
    this.currentAppBinding.set('home');
  }

  // Set up custom input controls for camera movement
  private setupCameraInputControls(): void {
    console.log('Setting up camera input controls...');
    
    // Only set up controls if this is running locally
    if (this.entity.owner.get().id === this.world.getServerPlayer().id) {
      return;
    }

    try {
      // Set up look controls using left stick for camera rotation
      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.LeftXAxis)) {
        this.lookInputX = hz.PlayerControls.connectLocalInput(
          hz.PlayerInputAction.LeftXAxis,
          hz.ButtonIcon.None,
          this,
          {
            customAssetIconId: this.props.cameraControlIcon?.id.toString(),
            preferredButtonPlacement: hz.ButtonPlacement.Center
          }
        );
      }

      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.LeftYAxis)) {
        this.lookInputY = hz.PlayerControls.connectLocalInput(
          hz.PlayerInputAction.LeftYAxis,
          hz.ButtonIcon.None,
          this,
          {
            customAssetIconId: this.props.cameraControlIcon?.id.toString(),
            preferredButtonPlacement: hz.ButtonPlacement.Center
          }
        );
      }

      // Set up movement controls using right stick for camera position (if available)
      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.RightXAxis)) {
        this.movementInputX = hz.PlayerControls.connectLocalInput(
          hz.PlayerInputAction.RightXAxis,
          hz.ButtonIcon.None,
          this,
          {
            customAssetIconId: this.props.movementControlIcon?.id.toString(),
            preferredButtonPlacement: hz.ButtonPlacement.Default
          }
        );
      }

      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.RightYAxis)) {
        this.movementInputY = hz.PlayerControls.connectLocalInput(
          hz.PlayerInputAction.RightYAxis,
          hz.ButtonIcon.None,
          this,
          {
            customAssetIconId: this.props.movementControlIcon?.id.toString(),
            preferredButtonPlacement: hz.ButtonPlacement.Default
          }
        );
      }

      // Set up exit control using right secondary button (F key on desktop)
      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.RightSecondary)) {
        this.exitInput = hz.PlayerControls.connectLocalInput(
          hz.PlayerInputAction.RightSecondary,
          hz.ButtonIcon.None,
          this,
          {
            preferredButtonPlacement: hz.ButtonPlacement.Default
          }
        );

        this.exitInput.registerCallback((action, pressed) => {
          if (pressed) {
            this.exitCameraMode();
          }
        });
      }

      // Start polling for input values
      this.startInputPolling();

      console.log('Camera input controls configured');
      
    } catch (error) {
      console.error('Failed to set up camera input controls:', error);
    }
  }

  // Start polling input values for smooth camera control
  private startInputPolling(): void {
    // Clear any existing polling interval
    if (this.inputPollingInterval) {
      this.async.clearInterval(this.inputPollingInterval);
    }

    // Use async.setInterval to continuously check input values
    this.inputPollingInterval = this.async.setInterval(() => {
      if (!this.isInCameraMode) {
        return;
      }

      let lookX = 0, lookY = 0, moveX = 0, moveY = 0;

      // Get axis values for camera control
      if (this.lookInputX) {
        lookX = this.lookInputX.axisValue.get();
      }
      if (this.lookInputY) {
        lookY = this.lookInputY.axisValue.get();
      }
      if (this.movementInputX) {
        moveX = this.movementInputX.axisValue.get();
      }
      if (this.movementInputY) {
        moveY = this.movementInputY.axisValue.get();
      }

      // Apply input if there's any significant movement
      if (Math.abs(lookX) > 0.1 || Math.abs(lookY) > 0.1) {
        this.handleCameraLook(lookX, lookY);
      }
      if (Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1) {
        this.handleCameraMovement(moveX, moveY);
      }

    }, 16); // ~60 FPS polling
  }

  // Clean up input controls
  private cleanupCameraInputControls(): void {
    console.log('Cleaning up camera input controls...');
    
    // Stop input polling
    if (this.inputPollingInterval) {
      this.async.clearInterval(this.inputPollingInterval);
      this.inputPollingInterval = null;
    }
    
    // The input controls will be automatically disposed when the component is disposed
    // Since we passed 'this' as the disposable object
    this.lookInputX = undefined;
    this.lookInputY = undefined;
    this.movementInputX = undefined;
    this.movementInputY = undefined;
    this.exitInput = undefined;
  }

  // Handle camera look/rotation input
  private handleCameraLook(deltaX: number, deltaY: number): void {
    if (!this.isInCameraMode || !this.cameraPosition) {
      return;
    }

    // Get current camera mode and update rotation based on input
    const lookSensitivity = 2.0;
    
    try {
      // For fixed camera mode, we can update the camera rotation
      // This is a simplified approach - in a real implementation you might want to 
      // track the current rotation and apply deltas
      console.log('Camera look input:', deltaX, deltaY);
      
      // Update the camera with new orientation
      // For now, we'll just log the input - proper rotation tracking would require
      // maintaining state of current camera orientation
      
    } catch (error) {
      console.error('Failed to handle camera look:', error);
    }
  }

  // Handle camera movement input
  private handleCameraMovement(deltaX: number, deltaY: number): void {
    if (!this.isInCameraMode || !this.cameraPosition) {
      return;
    }

    const movementSpeed = 0.2; // Reduced for smoother movement
    
    try {
      // Update camera position based on input
      // X-axis moves left/right, Y-axis moves forward/back
      const newPosition = new hz.Vec3(
        this.cameraPosition.x + (deltaX * movementSpeed),
        this.cameraPosition.y, // Keep Y constant for now
        this.cameraPosition.z + (deltaY * movementSpeed)
      );
      
      this.cameraPosition = newPosition;
      
      // Update the camera position in real-time with minimal transition for smooth movement
      LocalCamera.setCameraModeFixed({
        position: newPosition,
        duration: 0.05, // Very short transition for smooth movement
        easing: Easing.Linear
      });
      
      // Only log significant movements to avoid spam
      if (Math.abs(deltaX) > 0.3 || Math.abs(deltaY) > 0.3) {
        console.log('Camera moved to:', newPosition.toString());
      }
      
    } catch (error) {
      console.error('Failed to handle camera movement:', error);
    }
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
        backgroundColor: 'transparent'
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

                // Camera mode text with control instructions
                ui.View({
                  style: {
                    position: 'absolute',
                    bottom: 110,
                    left: 0,
                    right: 0,
                    width: '100%',
                    alignItems: 'center'
                  },
                  children: [
                    ui.Text({
                      text: 'Freeform Camera Mode',
                      style: {
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: 18,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        marginBottom: 8
                      }
                    }),
                    ui.Text({
                      text: 'Left Stick: Look Around | Right Stick: Move Camera | F: Exit',
                      style: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: 14,
                        fontWeight: '400',
                        textAlign: 'center'
                      }
                    })
                  ]
                }),

                // Debug indicator to show viewport coverage (temporary - remove when working)
                ui.View({
                  style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 4,
                    height: '100%',
                    backgroundColor: 'rgba(255, 0, 0, 0.8)', // Thick red line on left edge
                    zIndex: 100
                  }
                }),
                ui.View({
                  style: {
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 4,
                    height: '100%',
                    backgroundColor: 'rgba(255, 0, 0, 0.8)', // Thick red line on right edge
                    zIndex: 100
                  }
                }),
                ui.View({
                  style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    backgroundColor: 'rgba(0, 255, 0, 0.8)', // Green line on top edge
                    zIndex: 100
                  }
                }),
                ui.View({
                  style: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    backgroundColor: 'rgba(0, 255, 0, 0.8)' // Green line on bottom edge
                  }
                }),

        // Debug indicator to show viewport coverage (temporary - remove when working)
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: 4,
            height: '100%',
            backgroundColor: 'rgba(255, 0, 0, 0.8)',
            zIndex: 100
          }
        }),
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            right: 0,
            width: 4,
            height: '100%',
            backgroundColor: 'rgba(255, 0, 0, 0.8)',
            zIndex: 100
          }
        }),
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: 'rgba(0, 255, 0, 0.8)',
            zIndex: 100
          }
        }),
        ui.View({
          style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: 'rgba(0, 255, 0, 0.8)'
          }
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
