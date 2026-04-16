const JournalEntry = require("../models/JournalEntry");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/paginate");

const getJournalEntries = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.mood) {
    filter.mood = req.query.mood;
  }
  if (req.query.tag) {
    filter.tags = req.query.tag;
  }

  const sortField = req.query.sort || "-createdAt";
  const { skip, limit, buildResponse } = paginate(req.query);

  const [entries, total] = await Promise.all([
    JournalEntry.find(filter).sort(sortField).skip(skip).limit(limit),
    JournalEntry.countDocuments(filter),
  ]);

  res.status(200).json(buildResponse(entries, total));
});

const getJournalEntry = asyncHandler(async (req, res) => {
  const entry = await JournalEntry.findById(req.params.id);

  if (!entry) {
    return res.status(404).json({ message: "Journal entry not found" });
  }

  res.status(200).json(entry);
});

const createJournalEntry = asyncHandler(async (req, res) => {
  const { title, content, mood, tags } = req.body || {};

  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }
  if (!content) {
    return res.status(400).json({ message: "Content is required" });
  }

  const entry = await JournalEntry.create({ title, content, mood, tags });
  res.status(201).json(entry);
});

const updateJournalEntry = asyncHandler(async (req, res) => {
  const updatedEntry = await JournalEntry.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedEntry) {
    return res.status(404).json({ message: "Journal entry not found" });
  }

  res.status(200).json(updatedEntry);
});

const deleteJournalEntry = asyncHandler(async (req, res) => {
  const deletedEntry = await JournalEntry.findByIdAndDelete(req.params.id);

  if (!deletedEntry) {
    return res.status(404).json({ message: "Journal entry not found" });
  }

  res.status(200).json({ message: "Journal entry deleted successfully" });
});

module.exports = {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
};
