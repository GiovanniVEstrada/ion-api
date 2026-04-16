const mongoose = require("mongoose");

const journalEntrySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    mood: {
      type: String,
      enum: ["great", "good", "neutral", "bad", "awful"],
      default: "neutral",
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("JournalEntry", journalEntrySchema);
