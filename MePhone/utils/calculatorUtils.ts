export function formatCalculatorDisplay(value: string): string {
  if (value.length > 12) {
    const num = parseFloat(value);
    if (num > 999999999999) {
      return num.toExponential(5);
    }
    return num.toFixed(8).replace(/\.?0+$/, '');
  }
  return value;
}
