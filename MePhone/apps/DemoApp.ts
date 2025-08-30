import * as ui from 'horizon/ui';
import { AppHeader } from '../components/AppHeader';

interface DemoAppProps {
  title: string;
  icon: string;
  backgroundColor?: string;
  textColor?: string;
  description: string;
  onBack: () => void;
  onHome: () => void;
}

/**
 * DemoApp - Template for basic app structure
 * Shows how apps are integrated into the MePhone system
 */
export class DemoApp {
  public static render(props: DemoAppProps): ui.UINode {
    const backgroundColor = props.backgroundColor || '#FFFFFF';
    const textColor = props.textColor || '#000000';

    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: backgroundColor
      },
      children: [
        AppHeader.render({
          title: props.title,
          icon: props.icon,
          textColor: textColor,
          onBack: props.onBack,
          onHome: props.onHome
        }),
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          },
          children: [
            ui.Text({
              text: `${props.title} App`,
              style: {
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center',
                color: textColor,
                marginBottom: 12
              }
            }),
            ui.Text({
              text: props.description,
              style: {
                fontSize: 14,
                textAlign: 'center',
                color: textColor,
                opacity: 0.7,
                marginBottom: 20
              }
            }),
            ui.Text({
              text: '(App content from the root directory\nfiles will be integrated here)',
              style: {
                fontSize: 12,
                textAlign: 'center',
                color: textColor,
                opacity: 0.5
              }
            })
          ]
        })
      ]
    });
  }
}
