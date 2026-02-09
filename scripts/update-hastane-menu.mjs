import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const SHEET_ID = "1dxvTCpd-Yegvh7Zy1QkHC_hIwv9Zrwtld3FASVlMrzw";
const RANGE = "Veriler!A1:A12";

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function cell(values, row1) {
  const v = values?.[row1 - 1]?.[0];
  return (v ?? "").toString().trim();
}

async function main() {
  const sa = JSON.parse(mustEnv("GOOGLE_SA_JSON"));

  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  });

  const values = resp.data.values || [];
  while (values.length < 12) values.push([""]);

  const out = {
    updatedAt: new Date().toISOString(),
    lunchStats: cell(values, 2),
    lunchMenu: [cell(values, 3), cell(values, 4), cell(values, 5)].filter(Boolean),
    dinnerStats: cell(values, 7),
    dinnerMenu: [cell(values, 8), cell(values, 9), cell(values, 10)].filter(Boolean),
    aiDaily: cell(values, 11),
    aiMonthly: cell(values, 12),
  };

  const outPath = path.join(process.cwd(), "public", "hastane-menu.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf-8");

  console.log("OK ->", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
