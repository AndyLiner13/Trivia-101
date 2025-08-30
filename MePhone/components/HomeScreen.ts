import * as ui from 'horizon/ui';

type AppType = 'home' | 'phone' | 'calculator' | 'contacts' | 'mail' | 'browser' | 'settings';

interface HomeScreenProps {
  onAppSelect: (app: AppType) => void;
}

/**
 * HomeScreen - The main app grid interface
 * Updated: 2025-08-29 - Shows exactly 6 apps only
 * Uses the exact design from the original HomeScreen.ts
 */
export class HomeScreen {
  public static render(props: HomeScreenProps): ui.UINode {
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
                HomeScreen.createAppIcon('phone', 'Phone', '#10B981', '📞', props.onAppSelect), // green-500
                HomeScreen.createAppIcon('calculator', 'Calculator', '#3B82F6', '🧮', props.onAppSelect) // blue-500
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
                HomeScreen.createAppIcon('contacts', 'Contacts', '#F97316', '👥', props.onAppSelect), // orange-500
                HomeScreen.createAppIcon('mail', 'MeMail', '#EF4444', '📧', props.onAppSelect) // red-500
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
                HomeScreen.createAppIcon('browser', 'Browser', '#8B5CF6', '🌐', props.onAppSelect), // purple-500
                HomeScreen.createAppIcon('settings', 'Settings', '#6B7280', '⚙️', props.onAppSelect) // gray-500
              ]
            })
          ]
        })
      ]
    });
  }

  private static createAppIcon(
    appId: AppType,
    appName: string, 
    color: string, 
    iconSymbol: string,
    onAppSelect: (app: AppType) => void
  ): ui.UINode {
    return ui.Pressable({
      style: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6
      },
      onPress: () => onAppSelect(appId),
      children: [
        // App icon background
        ui.View({
          style: {
            width: 65,
            height: 65,
            backgroundColor: color,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10
          },
          children: [
            // App icon symbol/letter
            ui.Text({
              text: iconSymbol,
              style: {
                color: '#FFFFFF',
                fontSize: 26,
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
            fontSize: 13,
            fontWeight: '500',
            textAlign: 'center'
          }
        })
      ]
    });
  }
}
