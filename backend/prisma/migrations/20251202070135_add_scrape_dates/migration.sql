/*
  Warnings:

  - A unique constraint covering the columns `[name,date]` on the table `matches` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "scraped_dates" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scraped_dates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scraped_dates_date_key" ON "scraped_dates"("date");

-- CreateIndex
CREATE UNIQUE INDEX "matches_name_date_key" ON "matches"("name", "date");
