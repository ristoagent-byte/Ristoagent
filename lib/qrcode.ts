import QRCode from "qrcode";

export async function generateQRCodeDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 400,
    margin: 2,
    color: {
      dark: "#0a0f0d",
      light: "#ffffff",
    },
  });
}

export async function generateQRCodeBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    width: 400,
    margin: 2,
    type: "png",
    color: {
      dark: "#0a0f0d",
      light: "#ffffff",
    },
  });
}
