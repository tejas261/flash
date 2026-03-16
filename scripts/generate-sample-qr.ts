import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import QRCode from "qrcode";

async function main() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  const targetUrl = `${baseUrl}/r/demo-bistro`;
  const outputDir = path.join(process.cwd(), "public");
  const outputPath = path.join(outputDir, "sample-demo-bistro-qr.svg");

  const svg = await QRCode.toString(targetUrl, {
    type: "svg",
    margin: 1,
    color: {
      dark: "#111111",
      light: "#FFFFFF",
    },
  });

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, svg, "utf8");

  console.log(`Generated QR code for ${targetUrl}`);
  console.log(`Saved to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
