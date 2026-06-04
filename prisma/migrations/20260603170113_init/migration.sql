-- CreateTable
CREATE TABLE "Trade" (
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
    "pnl" REAL,
    "returnPct" REAL,
    "holdDays" INTEGER,
    "reinvestSuggestion" REAL
);

-- CreateTable
CREATE TABLE "MonthlyFuel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "month" TEXT NOT NULL,
    "yieldReceived" REAL NOT NULL,
    "deployed" REAL NOT NULL,
    "reinvestedBack" REAL NOT NULL
);
