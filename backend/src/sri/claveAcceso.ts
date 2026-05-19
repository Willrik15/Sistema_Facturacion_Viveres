interface ClaveAccesoInput {
  fechaEmision: Date;
  tipoComprobante: '01';
  ruc: string;
  ambiente: '1' | '2';
  estab: string;
  ptoEmi: string;
  secuencial: string;
  codigoNumerico: string;
  tipoEmision: '1';
}

export function generarClaveAcceso(input: ClaveAccesoInput): string {
  const dd = String(input.fechaEmision.getDate()).padStart(2, '0');
  const mm = String(input.fechaEmision.getMonth() + 1).padStart(2, '0');
  const yyyy = input.fechaEmision.getFullYear();

  const fechaFormato = `${dd}${mm}${yyyy}`;
  const ruc = input.ruc.replace(/\D/g, '').padStart(13, '0').slice(0, 13);
  const estab = input.estab.replace(/\D/g, '').padStart(3, '0').slice(0, 3);
  const ptoEmi = input.ptoEmi.replace(/\D/g, '').padStart(3, '0').slice(0, 3);
  const secuencial = input.secuencial
    .replace(/\D/g, '')
    .padStart(9, '0')
    .slice(0, 9);
  const codigoNumerico = input.codigoNumerico
    .replace(/\D/g, '')
    .padStart(8, '0')
    .slice(0, 8);

  const claveSinDigito =
    fechaFormato +
    input.tipoComprobante +
    ruc +
    input.ambiente +
    estab +
    ptoEmi +
    secuencial +
    codigoNumerico +
    input.tipoEmision;

  const digitoVerificador = calcularDigitoVerificador(claveSinDigito);

  return claveSinDigito + digitoVerificador;
}

function calcularDigitoVerificador(clave: string): number {
  const coeficientes = [2, 3, 4, 5, 6, 7];
  let total = 0;
  let index = 0;

  for (let i = clave.length - 1; i >= 0; i--) {
    total += Number(clave[i]) * coeficientes[index];
    index = (index + 1) % coeficientes.length;
  }

  const modulo = 11 - (total % 11);

  if (modulo === 11) return 0;
  if (modulo === 10) return 1;

  return modulo;
}
