const MoodEntry = require("../models/MoodEntry");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/paginate");

const getMoods = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.mood) {
    filter.mood = req.query.mood;
  }

  const sortField = req.query.sort || "-date";
  const { skip, limit, buildResponse } = paginate(req.query);

  const [moods, total] = await Promise.all([
    MoodEntry.find(filter).sort(sortField).skip(skip).limit(limit),
    MoodEntry.countDocuments(filter),
  ]);

  res.status(200).json(buildResponse(moods, total));
});

const createMood = asyncHandler(async (req, res) => {
  const { mood, note, date } = req.body || {};

  if (!mood) {
    return res.status(400).json({ message: "Mood is required" });
  }

  const entry = await MoodEntry.create({ mood, note, date });
  res.status(201).json(entry);
});

const updateMood = asyncHandler(async (req, res) => {
  const updatedMood = await MoodEntry.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedMood) {
    return res.status(404).json({ message: "Mood entry not found" });
  }

  res.status(200).json(updatedMood);
});

const deleteMood = asyncHandler(async (req, res) => {
  const deletedMood = await MoodEntry.findByIdAndDelete(req.params.id);

  if (!deletedMood) {
    return res.status(404).json({ message: "Mood entry not found" });
  }

  res.status(200).json({ message: "Mood entry deleted successfully" });
});

module.exports = {
  getMoods,
  createMood,
  updateMood,
  deleteMood,
};
