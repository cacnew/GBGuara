// Fase 10.6: Pix copia-e-cola (BR Code / EMV QRCPS-MPM) gerado localmente,
// sem gateway de pagamento. Formato TLV (id de 2 dígitos + tamanho de 2
// dígitos + valor) definido pelo Banco Central; ver manual "Arranjo Pix -
// QR Codes" do BCB. O CRC16-CCITT do campo 63 precisa ser calculado por
// último, sobre a string inteira (incluindo o próprio id/tamanho "6304").

function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

function crc16ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitizeAscii(value: string, maxLength: number, fallback: string): string {
  const clean = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim();
  return (clean || fallback).slice(0, maxLength);
}

export function buildPixPayload({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txid,
}: {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid: string;
}): string {
  const merchantAccountInfo = tlv("00", "br.gov.bcb.pix") + tlv("01", pixKey);
  const additionalData = tlv("05", sanitizeAscii(txid, 25, "***"));

  const fields =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("26", merchantAccountInfo) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", amount.toFixed(2)) +
    tlv("58", "BR") +
    tlv("59", sanitizeAscii(merchantName, 25, "NEXUSDOJO")) +
    tlv("60", sanitizeAscii(merchantCity, 15, "BRASIL")) +
    tlv("62", additionalData);

  const withCrcPlaceholder = `${fields}6304`;
  return `${withCrcPlaceholder}${crc16ccitt(withCrcPlaceholder)}`;
}
