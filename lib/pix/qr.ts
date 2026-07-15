import QRCode from "qrcode";

export async function generatePixQrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, { type: "svg", margin: 1, width: 220 });
}
