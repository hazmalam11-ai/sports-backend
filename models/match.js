const mongoose = require("mongoose");

// ✅ Schema للأحداث داخل المباراة
const MatchEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["goal", "card", "substitution", "penalty", "own-goal"],
    required: true
  },
  minute: {
    type: Number,
    required: true,
    min: 0,
    max: 120 // including extra time
  },
  player: {
    type: String,
    required: true,
    trim: true
  },
  team: {
    type: String,
    enum: ["home", "away"],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  cardType: {
    type: String,
    enum: ["yellow", "red"],
    required: function() { return this.type === "card"; }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// ✅ Match Schema المطور
const MatchSchema = new mongoose.Schema({
  homeTeam: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Team", 
    required: true 
  },
  awayTeam: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Team", 
    required: true 
  },
  tournament: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Tournament", 
    required: true 
  },
  
  // ✅ النتائج
  scoreA: { 
    type: Number, 
    default: 0,
    min: 0
  },
  scoreB: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  // ✅ التوقيت والمكان
  date: { 
    type: Date, 
    default: Date.now 
  },
  venue: { 
    type: String, 
    required: true, 
    trim: true 
  },
  
  // ✅ معلومات المباراة المباشرة
  status: {
    type: String,
    enum: ["scheduled", "live", "half-time", "finished", "postponed", "cancelled"],
    default: "scheduled"
  },
  minute: {
    type: Number,
    default: 0,
    min: 0,
    max: 120
  },
  
  // ✅ أحداث المباراة
  events: [MatchEventSchema],
  
  // ✅ إحصائيات المباراة (اختيارية)
  stats: {
    possession: {
      home: { type: Number, min: 0, max: 100, default: 50 },
      away: { type: Number, min: 0, max: 100, default: 50 }
    },
    shots: {
      home: { type: Number, default: 0, min: 0 },
      away: { type: Number, default: 0, min: 0 }
    },
    shotsOnTarget: {
      home: { type: Number, default: 0, min: 0 },
      away: { type: Number, default: 0, min: 0 }
    },
    corners: {
      home: { type: Number, default: 0, min: 0 },
      away: { type: Number, default: 0, min: 0 }
    },
    fouls: {
      home: { type: Number, default: 0, min: 0 },
      away: { type: Number, default: 0, min: 0 }
    },
    yellowCards: {
      home: { type: Number, default: 0, min: 0 },
      away: { type: Number, default: 0, min: 0 }
    },
    redCards: {
      home: { type: Number, default: 0, min: 0 },
      away: { type: Number, default: 0, min: 0 }
    }
  },
  
  // ✅ معلومات إضافية
  referee: {
    type: String,
    trim: true
  },
  attendance: {
    type: Number,
    min: 0
  },
  weather: {
    type: String,
    trim: true
  },
  temperature: {
    type: Number
  },
  
  // ✅ معلومات الإنشاء والتحديث
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true // يضيف createdAt و updatedAt تلقائياً
});

// ✅ Indexes لتحسين الأداء
MatchSchema.index({ date: -1 }); // للبحث بالتاريخ
MatchSchema.index({ status: 1 }); // للبحث بالحالة
MatchSchema.index({ homeTeam: 1, awayTeam: 1 }); // للبحث بالفرق
MatchSchema.index({ tournament: 1 }); // للبحث بالبطولة

// ✅ Virtual للحصول على النتيجة كـ string
MatchSchema.virtual('scoreString').get(function() {
  return `${this.scoreA} - ${this.scoreB}`;
});

// ✅ Method للحصول على آخر الأحداث
MatchSchema.methods.getLatestEvents = function(limit = 5) {
  return this.events
    .sort((a, b) => b.minute - a.minute)
    .slice(0, limit);
};

// ✅ Method لحساب إجمالي الكروت
MatchSchema.methods.getTotalCards = function() {
  return {
    home: {
      yellow: this.stats.yellowCards.home,
      red: this.stats.redCards.home,
      total: this.stats.yellowCards.home + this.stats.redCards.home
    },
    away: {
      yellow: this.stats.yellowCards.away,
      red: this.stats.redCards.away,
      total: this.stats.yellowCards.away + this.stats.redCards.away
    }
  };
};

// ✅ Static method للحصول على المباريات المباشرة
MatchSchema.statics.getLiveMatches = function() {
  return this.find({ 
    status: { $in: ["live", "half-time"] } 
  })
  .populate("homeTeam", "name country logo")
  .populate("awayTeam", "name country logo")
  .populate("tournament", "name year country")
  .sort({ minute: -1 });
};

// ✅ Static method للحصول على مباريات اليوم
MatchSchema.statics.getTodayMatches = function() {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  return this.find({
    date: { $gte: startOfDay, $lte: endOfDay }
  })
  .populate("homeTeam", "name country logo")
  .populate("awayTeam", "name country logo")
  .populate("tournament", "name year country")
  .sort({ date: 1 });
};

// ✅ Pre-save middleware لتحديث الإحصائيات عند إضافة أحداث
MatchSchema.pre('save', function(next) {
  if (this.isModified('events')) {
    // إعادة حساب الكروت من الأحداث
    this.stats.yellowCards.home = this.events.filter(e => 
      e.type === 'card' && e.cardType === 'yellow' && e.team === 'home'
    ).length;
    
    this.stats.yellowCards.away = this.events.filter(e => 
      e.type === 'card' && e.cardType === 'yellow' && e.team === 'away'
    ).length;
    
    this.stats.redCards.home = this.events.filter(e => 
      e.type === 'card' && e.cardType === 'red' && e.team === 'home'
    ).length;
    
    this.stats.redCards.away = this.events.filter(e => 
      e.type === 'card' && e.cardType === 'red' && e.team === 'away'
    ).length;
  }
  next();
});

module.exports = mongoose.model("Match", MatchSchema);