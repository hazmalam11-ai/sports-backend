// تعريف الأدوار
module.exports.ROLES = {
  ADMIN: "admin",
  MOD: "moderator",
  EDITOR: "editor",
  USER: "user",
  GUEST: "guest",
};

// تعريف الصلاحيات (RBAC Permissions)
module.exports.PERMISSIONS = {
  // Matches
  "match:create": ["admin", "editor"],
  "match:update": ["admin", "editor", "moderator"],
  "match:delete": ["admin"],

  // Teams
  "team:create": ["admin", "editor"],
  "team:update": ["admin", "editor"],
  "team:delete": ["admin"],

  // Tournaments
  "tournament:create": ["admin", "editor"],
  "tournament:update": ["admin", "editor"],
  "tournament:delete": ["admin"],

  // News
  "news:create": ["admin", "editor"],
  "news:update": ["admin", "editor"],
  "news:delete": ["admin"],

  // Comments
  "comment:create": ["admin", "editor", "user"],
  "comment:moderate": ["admin", "moderator"], // حذف/إخفاء أي تعليق
};

  