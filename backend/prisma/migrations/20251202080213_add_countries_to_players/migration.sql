/*
  Warnings:

  - Added the required column `country` to the `players` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "players" ADD COLUMN     "country" TEXT NOT NULL;
