import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import { PhoneFrame } from './components/PhoneFrame';
import { HomeScreen } from './components/HomeScreen';
import { PhoneApp } from './apps/PhoneApp';
import { CalculatorApp } from './apps/CalculatorApp';

export type ScreenType = 'home' | 'phone' | 'calculator' | 'contacts' | 'mail' | 'browser' | 'settings';

export class MePhone extends ui.UIComponent<typeof MePhone> {
  static propsDefinition = {};

  // Main screen navigation
  private currentScreenBinding = new ui.Binding<ScreenType>('home');
  
  // Phone app state
  private phoneNumberBinding = new ui.Binding<string>('');
  private isDialingBinding = new ui.Binding<boolean>(false);
  
  // Calculator app state
  private calcDisplayBinding = new ui.Binding<string>('0');
  private calcPreviousValueBinding = new ui.Binding<string>('');
  private calcOperationBinding = new ui.Binding<string>('');
  private calcWaitingForOperandBinding = new ui.Binding<boolean>(false);

  initializeUI(): ui.UINode {
    return new PhoneFrame({
      currentScreenBinding: this.currentScreenBinding,
      phoneNumberBinding: this.phoneNumberBinding,
      isDialingBinding: this.isDialingBinding,
      calcDisplayBinding: this.calcDisplayBinding,
      calcPreviousValueBinding: this.calcPreviousValueBinding,
      calcOperationBinding: this.calcOperationBinding,
      calcWaitingForOperandBinding: this.calcWaitingForOperandBinding,
      onNavigateToScreen: this.navigateToScreen.bind(this),
      onNavigateToPhone: this.navigateToPhone.bind(this)
    }).render();
  }

  start() {
    super.start();
  }

  private navigateToScreen(screen: ScreenType): void {
    this.currentScreenBinding.set(screen);
    
    // Reset app states when navigating
    if (screen === 'phone') {
      this.phoneNumberBinding.set('');
      this.isDialingBinding.set(false);
    } else if (screen === 'calculator') {
      this.calcDisplayBinding.set('0');
      this.calcPreviousValueBinding.set('');
      this.calcOperationBinding.set('');
      this.calcWaitingForOperandBinding.set(false);
    }
  }

  private navigateToPhone(contactData: { name: string; phone: string; avatar: string }): void {
    // Pre-fill the phone number from contact
    this.phoneNumberBinding.set(contactData.phone.replace(/\D/g, '')); // Remove formatting
    this.isDialingBinding.set(false);
    this.currentScreenBinding.set('phone');
  }
}

// Component registration is handled in the main MePhone.ts file
