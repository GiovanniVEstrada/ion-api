const Habit = require("../models/Habit");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/paginate");

const getHabits = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.active !== undefined) {
    filter.active = req.query.active === "true";
  }
  if (req.query.frequency) {
    filter.frequency = req.query.frequency;
  }

  const sortField = req.query.sort || "-createdAt";
  const { skip, limit, buildResponse } = paginate(req.query);

  const [habits, total] = await Promise.all([
    Habit.find(filter).sort(sortField).skip(skip).limit(limit),
    Habit.countDocuments(filter),
  ]);

  res.status(200).json(buildResponse(habits, total));
});

const createHabit = asyncHandler(async (req, res) => {
  const { name, description, frequency } = req.body || {};

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  const habit = await Habit.create({ name, description, frequency });
  res.status(201).json(habit);
});

const updateHabit = asyncHandler(async (req, res) => {
  const updatedHabit = await Habit.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedHabit) {
    return res.status(404).json({ message: "Habit not found" });
  }

  res.status(200).json(updatedHabit);
});

const deleteHabit = asyncHandler(async (req, res) => {
  const deletedHabit = await Habit.findByIdAndDelete(req.params.id);

  if (!deletedHabit) {
    return res.status(404).json({ message: "Habit not found" });
  }

  res.status(200).json({ message: "Habit deleted successfully" });
});

const completeHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findById(req.params.id);

  if (!habit) {
    return res.status(404).json({ message: "Habit not found" });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const alreadyCompleted = habit.completedDates.some((date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  if (alreadyCompleted) {
    return res.status(400).json({ message: "Habit already completed today" });
  }

  habit.completedDates.push(today);
  await habit.save();

  res.status(200).json(habit);
});

module.exports = {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
};
