import * as ui from 'horizon/ui';

export interface SectionHeaderProps {
  title: string;
}

export class SectionHeader {
  constructor(private props: SectionHeaderProps) {}

  render(): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB', // gray-50
        paddingHorizontal: 16,
        paddingVertical: 8,
        width: '100%'
      },
      children: [
        ui.Text({
          text: this.props.title.toUpperCase(),
          style: {
            fontSize: 12,
            color: '#6B7280',
            fontWeight: '500'
          }
        })
      ]
    });
  }
}
