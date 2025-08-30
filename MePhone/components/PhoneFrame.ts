import * as ui from 'horizon/ui';
import { ScreenType } from '../index';

interface PhoneFrameProps {
  currentApp: ScreenType;
  timeDisplay: string;
  children: ui.UINode;
}

/**
 * PhoneFrame - The physical phone container with status bar
 * This component provides the visual phone frame and status bar
 */
export class PhoneFrame {
  public static render(props: PhoneFrameProps): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        padding: 20
      },
      children: [
        // Phone container with realistic proportions
        ui.View({
          style: {
            width: 220,
            height: 420,
            backgroundColor: '#000000', // Black phone frame
            borderRadius: 25,
            padding: 8,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000000',
            shadowOffset: [0, 4],
            shadowOpacity: 0.3,
            shadowRadius: 10
          },
          children: [
            // Phone screen content area
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                overflow: 'hidden',
                position: 'relative'
              },
              children: [
                // Status bar
                PhoneFrame.renderStatusBar(props.currentApp, props.timeDisplay),
                // App content area
                ui.View({
                  style: {
                    width: '100%',
                    height: '100%',
                    paddingTop: 25, // Account for status bar
                    overflow: 'hidden'
                  },
                  children: [props.children]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private static renderStatusBar(currentApp: ScreenType, timeDisplay: string): ui.UINode {
    return ui.View({
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 25,
        backgroundColor: currentApp === 'home' ? 'transparent' : 'rgba(0, 0, 0, 0.05)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
        zIndex: 1000
      },
      children: [
        // Time display
        ui.Text({
          text: timeDisplay,
          style: {
            fontSize: 11,
            fontWeight: '600',
            color: currentApp === 'home' ? '#FFFFFF' : '#000000'
          }
        }),
        // Signal and battery indicators
        ui.View({
          style: {
            flexDirection: 'row',
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: '📶',
              style: {
                fontSize: 10,
                marginRight: 4,
                color: currentApp === 'home' ? '#FFFFFF' : '#000000'
              }
            }),
            ui.Text({
              text: '🔋',
              style: {
                fontSize: 10,
                color: currentApp === 'home' ? '#FFFFFF' : '#000000'
              }
            })
          ]
        })
      ]
    });
  }
}
