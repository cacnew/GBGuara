export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatBrazilianPhone(value: string | null | undefined): string {
  if (!value) return "";

  let digits = onlyDigits(value);

  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }

  if (digits.length > 11) {
    digits = digits.slice(-11);
  }

  if (digits.length <= 2) return digits;

  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);

  if (number.length <= 4) {
    return `(${areaCode}) ${number}`;
  }

  if (number.length <= 8) {
    return `(${areaCode}) ${number.slice(0, 4)}-${number.slice(4)}`;
  }

  return `(${areaCode}) ${number.slice(0, 5)}-${number.slice(5, 9)}`;
}

export function maskBrazilianPhoneInput(value: string): string {
  return formatBrazilianPhone(value);
}
