import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const SHEET_ID = "1dxvTCpd-Yegvh7Zy1QkHC_hIwv9Zrwtld3FASVlMrzw";

// Menü kaynağı: netten sayfası (A:D) -> A=Date, B=Kahvaltı, C=Öğle, D=Akşam
const RANGE_NETTEN = "netten!A:D";

// İstatistik kaynağı: Veriler sayfası
const RANGE_VERILER_STATS = "Veriler!A3:A8"; // A3 ve A8'i tek seferde alacağız

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function safeStr(v) {
  return (v ?? "").toString().trim();
}

function parseMenuCell(cellText) {
  // Hücreler şöyle geliyor: ", ETLİ NOHUT, PİRİNÇ PİLAVI, TURŞU,  ,"
  // Virgülle parçala, boşları at
  return safeStr(cellText)
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function todayTR_ddmmyyyy() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

async function main() {
  const rawSecret = mustEnv("GOOGLE_SA_JSON").trim();
  if (!rawSecret.startsWith("{")) {
    throw new Error("GOOGLE_SA_JSON secret JSON olmalı (ilk karakter '{' olmalı).");
  }
  const sa = JSON.parse(rawSecret);

  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  // 1) netten tablosunu çek
  const nettenResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE_NETTEN,
    majorDimension: "ROWS",
  });

  const rows = nettenResp.data.values || [];

  // 2) Veriler A3 ve A8'i çek (A3:A8 arası alıp sadece 3 ve 8'i kullanacağız)
  const verilerResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE_VERILER_STATS,
    majorDimension: "ROWS",
  });
  const vs = verilerResp.data.values || [];
  const A3 = safeStr(vs?.[0]?.[0]); // A3
  const A8 = safeStr(vs?.[5]?.[0]); // A8 (A3->idx0, A8->idx5)

  // 3) Bugünün satırını bul (netten sütun A: dd.mm.yyyy)
  const todayKey = todayTR_ddmmyyyy();

  // İlk satır başlık olabilir (Değişiklik Zamanı vb). O yüzden tüm satırlarda arıyoruz.
  const todayRow = rows.find(r => safeStr(r?.[0]) === todayKey);

  // netten: A=Date, C=Lunch, D=Dinner
  const lunchCell = todayRow ? safeStr(todayRow?.[2]) : "";
  const dinnerCell = todayRow ? safeStr(todayRow?.[3]) : "";

  const out = {
    updatedAt: new Date().toISOString(),
    date: todayKey,
    lunchStats: A3,
    lunchMenu: parseMenuCell(lunchCell),
    dinnerStats: A8,
    dinnerMenu: parseMenuCell(dinnerCell),
    // İstersen bunu da gösterirsin, istemezsen frontend’de kullanmazsın:
    source: "netten!A:D + Veriler!A3,A8",
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
