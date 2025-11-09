// services/autoSync.js
const { syncMatchesInRange, syncLiveMatches } = require("./matchSync");

// ===============================
// 🟢 AUTO SYNC SYSTEM
// ===============================

// فلاغ علشان نمنع تشغيل نفس الـ sync مرتين في نفس الوقت
let isSyncingMatches = false;

// دالة Sync شاملة (أسبوع فات + أسبوع جاي)
const autoSyncMatches = async () => {
  if (isSyncingMatches) {
    console.log("⚠️ Sync already running, skipping...");
    return;
  }
  try {
    isSyncingMatches = true;
    console.log(`🚀 [${new Date().toISOString()}] Starting auto sync (week back + week forward)...`);
    await syncMatchesInRange(7, 7); // أسبوع فات + أسبوع جاي
    console.log(`✅ [${new Date().toISOString()}] Auto sync finished.`);
  } catch (err) {
    console.error("❌ Auto sync failed:", err.message);
  } finally {
    isSyncingMatches = false;
  }
};

// دالة Sync لايف (كل دقيقتين)
const autoSyncLive = async () => {
  try {
    console.log(`📡 [${new Date().toISOString()}] Syncing live matches...`);
    await syncLiveMatches();
    console.log(`✅ [${new Date().toISOString()}] Live matches updated.`);
  } catch (err) {
    console.error("❌ Live sync failed:", err.message);
  }
};

// ✅ تشغيل أول مرة مباشرة عند تشغيل السيرفر
autoSyncMatches();
autoSyncLive();

// ✅ تشغيل المزامنة كل ساعة (week range)
setInterval(autoSyncMatches, 1000 * 60 * 60); // كل ساعة

// ✅ تشغيل المزامنة كل دقيقتين (live)
setInterval(autoSyncLive, 1000 * 60 * 2); // كل دقيقتين