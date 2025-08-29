import * as ui from 'horizon/ui';
import { ScreenType } from '../index';

interface HomeScreenProps {
  onNavigateToScreen: (screen: ScreenType) => void;
}

export class HomeScreen {
  constructor(private props: HomeScreenProps) {}

  render(): ui.UINode {
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
        padding: '3%',
        overflow: 'hidden' // Ensure gradient doesn't bleed
      },
      children: [
        // App Grid Container
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            padding: '8%'
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
                this.createAppIcon('Phone', '#10B981', 'phone'), // green-500
                this.createAppIcon('Calculator', '#3B82F6', 'calculator') // blue-500
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
                this.createAppIcon('Contacts', '#F97316', 'contacts'), // orange-500
                this.createAppIcon('MeMail', '#EF4444', 'mail') // red-500
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
                this.createAppIcon('Browser', '#8B5CF6', 'browser'), // purple-500
                this.createAppIcon('Settings', '#6B7280', 'settings') // gray-500
              ]
            })
          ]
        })
      ]
    });
  }

  private createAppIcon(appName: string, color: string, appId: ScreenType): ui.UINode {
    return ui.Pressable({
      style: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6
      },
      onPress: () => {
        console.log(`Pressed ${appName} app`);
        this.props.onNavigateToScreen(appId);
      },
      children: [
        // App icon background
        ui.View({
          style: {
            width: 55,
            height: 55,
            backgroundColor: color,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 6
          },
          children: [
            // App icon symbol/letter
            ui.Text({
              text: this.getAppIconSymbol(appId),
              style: {
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: 'bold',
                textAlign: 'center'
              }
            })
          ]
        }),
        
        // App name label
        ui.Text({
          text: appName,
          style: {
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '500',
            textAlign: 'center'
          }
        })
      ]
    });
  }

  private getAppIconSymbol(appId: ScreenType): string {
    switch (appId) {
      case 'phone': return '📞';
      case 'calculator': return '🧮';
      case 'contacts': return '👥';
      case 'mail': return '📧';
      case 'browser': return '🌐';
      case 'settings': return '⚙️';
      default: return '📱';
    }
  }
}
