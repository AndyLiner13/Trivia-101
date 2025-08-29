import * as ui from 'horizon/ui';

export interface ListItemProps {
  leftContent: string;
  title: string;
  subtitle?: string;
  rightContent?: ui.UINode;
  onClick?: () => void;
  isUnread?: boolean;
  isSelected?: boolean;
}

export class ListItem {
  constructor(private props: ListItemProps) {}

  render(): ui.UINode {
    return ui.Pressable({
      style: {
        backgroundColor: this.props.isUnread ? '#EFF6FF' : (this.props.isSelected ? '#F3F4F6' : '#FFFFFF'),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        width: '100%'
      },
      onPress: this.props.onClick,
      children: [
        // Left content (avatar)
        ui.View({
          style: {
            width: 48,
            height: 48,
            backgroundColor: '#3B82F6', // blue-500
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12
          },
          children: [
            ui.Text({
              text: this.props.leftContent,
              style: {
                fontSize: 24,
                color: '#FFFFFF'
              }
            })
          ]
        }),
        
        // Main content
        ui.View({
          style: {
            flex: 1,
            flexDirection: 'column',
            marginRight: 8
          },
          children: [
            ui.Text({
              text: this.props.title,
              style: {
                fontSize: 16,
                fontWeight: this.props.isUnread ? 'bold' : '400',
                color: '#111827',
                marginBottom: this.props.subtitle ? 2 : 0
              }
            }),
            ...(this.props.subtitle ? [
              ui.Text({
                text: this.props.subtitle,
                style: {
                  fontSize: 14,
                  color: '#6B7280',
                  fontWeight: this.props.isUnread ? '500' : '400'
                }
              })
            ] : [])
          ]
        }),
        
        // Right content
        ...(this.props.rightContent ? [this.props.rightContent] : [])
      ]
    });
  }
}
