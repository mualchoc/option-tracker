-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticker" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "strike" REAL NOT NULL,
    "expiry" DATETIME NOT NULL,
    "premiumPaid" REAL NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "exitPrice" REAL,
    "exitDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "contracts" INTEGER NOT NULL DEFAULT 1,
    "executedPrice" REAL,
    "tradeFee" REAL,
    "pnl" REAL,
    "returnPct" REAL,
    "holdDays" INTEGER,
    "reinvestSuggestion" REAL
);
INSERT INTO "new_Trade" ("entryDate", "exitDate", "exitPrice", "expiry", "holdDays", "id", "notes", "pnl", "premiumPaid", "reinvestSuggestion", "returnPct", "status", "strike", "ticker", "type") SELECT "entryDate", "exitDate", "exitPrice", "expiry", "holdDays", "id", "notes", "pnl", "premiumPaid", "reinvestSuggestion", "returnPct", "status", "strike", "ticker", "type" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
