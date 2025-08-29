import { Text, UIComponent, UINode, View } from 'horizon/ui';

class MeMailApp extends UIComponent<typeof MeMailApp> {
  protected panelHeight: number = 300;
  protected panelWidth: number = 500;

  static propsDefinition = {};

  initializeUI(): UINode {
    // Return a UINode to specify the contents of your UI.
    // For more details and examples go to:
    // https://developers.meta.com/horizon-worlds/learn/documentation/typescript/api-references-and-examples/custom-ui

    return View({
      children: [
        Text({
          text: "New UI Panel",
          style: {
            fontSize: 48,
            textAlign: 'center',
            textAlignVertical: 'center',
            height: this.panelHeight,
            width: this.panelWidth,
          }
        })
      ],
      style: {
        backgroundColor: 'black',
        height: this.panelHeight,
        width: this.panelWidth,
      }
    });
  }
}
UIComponent.register(MeMailApp);
