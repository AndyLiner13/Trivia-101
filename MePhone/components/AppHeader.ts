import * as ui from 'horizon/ui';

interface AppHeaderProps {
  title: string;
  icon: string;
  textColor?: string;
  onBack: () => void;
  onHome: () => void;
}

/**
 * AppHeader - Standard header component for all apps
 * Provides consistent navigation and styling across apps
 */
export class AppHeader {
  public static render(props: AppHeaderProps): ui.UINode {
    const textColor = props.textColor || '#000000';

    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB'
      },
      children: [
        // Back button
        ui.Pressable({
          style: {
            padding: 8,
            borderRadius: 8
          },
          onPress: props.onBack,
          children: [
            ui.Text({
              text: '←',
              style: {
                fontSize: 18,
                color: textColor,
                fontWeight: 'bold'
              }
            })
          ]
        }),
        // App title and icon
        ui.View({
          style: {
            flexDirection: 'row',
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: props.icon,
              style: {
                fontSize: 18,
                marginRight: 8
              }
            }),
            ui.Text({
              text: props.title,
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: textColor
              }
            })
          ]
        }),
        // Home button
        ui.Pressable({
          style: {
            padding: 8,
            borderRadius: 8
          },
          onPress: props.onHome,
          children: [
            ui.Text({
              text: '🏠',
              style: {
                fontSize: 16
              }
            })
          ]
        })
      ]
    });
  }
}
