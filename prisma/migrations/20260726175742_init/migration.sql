-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notionId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" TEXT,
    "sector" TEXT,
    "status" TEXT,
    "connectionStatus" TEXT,
    "programs" TEXT,
    "notes" TEXT,
    "keyContacts" TEXT,
    "nextAction" TEXT,
    "nextActionDate" DATETIME,
    "notionUrl" TEXT,
    "lastEditedAt" DATETIME,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ResearchCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "hqCity" TEXT,
    "csrBudget" TEXT,
    "csrFocus" TEXT,
    "themes" TEXT NOT NULL DEFAULT '[]',
    "iitConnect" TEXT,
    "warmPath" TEXT,
    "fitRationale" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Tier 3',
    "status" TEXT NOT NULL DEFAULT 'New',
    "sourceUrls" TEXT,
    "notes" TEXT,
    "notionPageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ResearchLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "role" TEXT,
    "iitAffiliation" TEXT,
    "linkedinUrl" TEXT,
    "email" TEXT,
    "warmPath" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResearchLead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ResearchCompany" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsIn" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_notionId_key" ON "Prospect"("notionId");

-- CreateIndex
CREATE INDEX "Prospect_source_idx" ON "Prospect"("source");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchCompany_name_key" ON "ResearchCompany"("name");

-- CreateIndex
CREATE INDEX "ResearchCompany_sector_idx" ON "ResearchCompany"("sector");

-- CreateIndex
CREATE INDEX "ResearchCompany_status_idx" ON "ResearchCompany"("status");

-- CreateIndex
CREATE INDEX "ResearchLead_companyId_idx" ON "ResearchLead"("companyId");
