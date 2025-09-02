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
  
  // Reference to camera overlay (will be set externally)
  private cameraOverlay: any = null;

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
        this.renderPhoneFrame()
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

  // Simple method to trigger camera overlay
  private openCameraOverlay(): void {
    console.log('Opening camera overlay...');
    
    // This will be called by external camera overlay script
    // For now, just log the action
    console.log('Camera overlay should be triggered by separate CameraOverlay.ts script');
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
          // Trigger camera overlay instead of switching apps
          this.openCameraOverlay();
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

  // Method to set camera overlay reference (called externally)
  public setCameraOverlay(overlay: any): void {
    this.cameraOverlay = overlay;
  }
}

hz.Component.register(CameraApp);
