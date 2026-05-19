// Validación de email
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Validación de teléfono ecuatoriano
export function isValidPhone(phone: string): boolean {
  const re = /^[\d\s()+-]{7,15}$/
  return re.test(phone)
}

// Validación de RUC ecuatoriano
export function isValidRUC(ruc: string): boolean {
  return ruc.length === 13 && /^\d{13}$/.test(ruc)
}

// Validación de cédula ecuatoriana
export function isValidCedula(cedula: string): boolean {
  return cedula.length === 10 && /^\d{10}$/.test(cedula)
}

// Validación de precio
export function isValidPrice(price: number): boolean {
  return typeof price === 'number' && price > 0
}

// Validación de código de barras
export function isValidBarcode(barcode: string): boolean {
  return barcode.length >= 8 && /^\d+$/.test(barcode)
}

// Validación de cantidad
export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0
}
