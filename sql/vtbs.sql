/*
 Navicat Premium Data Transfer

 Source Server         : node-dd-signal
 Source Server Type    : SQLite
 Source Server Version : 3030001
 Source Schema         : main

 Target Server Type    : SQLite
 Target Server Version : 3030001
 File Encoding         : 65001

 Date: 24/02/2021 21:20:20
*/

PRAGMA foreign_keys = false;

-- ----------------------------
-- Table structure for vtbs
-- ----------------------------
DROP TABLE IF EXISTS "vtbs";
CREATE TABLE "vtbs" (
  "mid" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "usernick" TEXT,
  "liveStatus" TEXT DEFAULT null,
  "title" TEXT,
  "platform" TEXT DEFAULT "panda",
  "hls" TEXT,
  PRIMARY KEY ("mid", "username")
);

PRAGMA foreign_keys = true;
