import * as ui from 'horizon/ui';
import { ScreenType } from '../index';
import { HomeScreen } from './HomeScreen';
import { PhoneApp } from '../apps/PhoneApp';
import { CalculatorApp } from '../apps/CalculatorApp';
import { ContactsApp } from '../apps/ContactsApp';

interface PhoneFrameProps {
  currentScreenBinding: ui.Binding<ScreenType>;
  phoneNumberBinding: ui.Binding<string>;
  isDialingBinding: ui.Binding<boolean>;
  calcDisplayBinding: ui.Binding<string>;
  calcPreviousValueBinding: ui.Binding<string>;
  calcOperationBinding: ui.Binding<string>;
  calcWaitingForOperandBinding: ui.Binding<boolean>;
  onNavigateToScreen: (screen: ScreenType) => void;
  onNavigateToPhone?: (contactData: { name: string; phone: string; avatar: string }) => void;
}

export class PhoneFrame {
  constructor(private props: PhoneFrameProps) {}

  render(): ui.UINode {
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
                this.renderCurrentScreen()
              ]
            })
          ]
        })
      ]
    });
  }

  private renderCurrentScreen(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Home Screen
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.props.currentScreenBinding], (screen) => 
              screen === 'home' ? 'flex' : 'none'
            )
          },
          children: [
            new HomeScreen({
              onNavigateToScreen: this.props.onNavigateToScreen
            }).render()
          ]
        }),
        // Phone App Screen
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.props.currentScreenBinding], (screen) => 
              screen === 'phone' ? 'flex' : 'none'
            )
          },
          children: [
            new PhoneApp({
              phoneNumberBinding: this.props.phoneNumberBinding,
              isDialingBinding: this.props.isDialingBinding,
              onNavigateToScreen: this.props.onNavigateToScreen
            }).render()
          ]
        }),
        // Calculator App Screen
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.props.currentScreenBinding], (screen) => 
              screen === 'calculator' ? 'flex' : 'none'
            )
          },
          children: [
            new CalculatorApp({
              calcDisplayBinding: this.props.calcDisplayBinding,
              calcPreviousValueBinding: this.props.calcPreviousValueBinding,
              calcOperationBinding: this.props.calcOperationBinding,
              calcWaitingForOperandBinding: this.props.calcWaitingForOperandBinding,
              onNavigateToScreen: this.props.onNavigateToScreen
            }).render()
          ]
        }),
        // Contacts App Screen
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.props.currentScreenBinding], (screen) => 
              screen === 'contacts' ? 'flex' : 'none'
            )
          },
          children: [
            new ContactsApp({
              onNavigateToScreen: this.props.onNavigateToScreen,
              onNavigateToPhone: this.props.onNavigateToPhone
            }).render()
          ]
        })
      ]
    });
  }
}
