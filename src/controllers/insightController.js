const Task = require("../models/Task");
const JournalEntry = require("../models/JournalEntry");
const Habit = require("../models/Habit");
const MoodEntry = require("../models/MoodEntry");
const asyncHandler = require("../utils/asyncHandler");

const MOOD_SCORES = { great: 5, good: 4, neutral: 3, bad: 2, awful: 1 };
const DAY_MS = 86400000;

// Helpers
const startOfWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1);

const calculateStreaks = (completedDates) => {
  if (!completedDates.length) return { currentStreak: 0, longestStreak: 0 };

  const dates = [
    ...new Set(
      completedDates.map((d) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    ),
  ].sort((a, b) => a - b);

  // Longest streak
  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (dates[i] - dates[i - 1] === DAY_MS) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak (counts if last completion was today or yesterday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const yesterdayMs = todayMs - DAY_MS;
  const last = dates[dates.length - 1];

  let current = 0;
  if (last === todayMs || last === yesterdayMs) {
    current = 1;
    for (let i = dates.length - 2; i >= 0; i--) {
      if (dates[i + 1] - dates[i] === DAY_MS) {
        current++;
      } else {
        break;
      }
    }
  }

  return { currentStreak: current, longestStreak: longest };
};

// GET /api/insights/overview
const getOverview = asyncHandler(async (req, res) => {
  const [totalTasks, completedTasks, totalJournalEntries, totalHabits, activeHabits] =
    await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ completed: true }),
      JournalEntry.countDocuments(),
      Habit.countDocuments(),
      Habit.countDocuments({ active: true }),
    ]);

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0;

  res.status(200).json({
    totalTasks,
    completedTasks,
    completionRate,
    totalJournalEntries,
    totalHabits,
    activeHabits,
  });
});

// GET /api/insights/productivity
const getProductivity = asyncHandler(async (req, res) => {
  const now = new Date();

  const [completedThisWeek, overdueCount, totalTasks, completedTasks] = await Promise.all([
    Task.countDocuments({ completed: true, updatedAt: { $gte: startOfWeek() } }),
    Task.countDocuments({ completed: false, dueDate: { $lt: now } }),
    Task.countDocuments(),
    Task.countDocuments({ completed: true }),
  ]);

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0;

  res.status(200).json({
    completedThisWeek,
    overdueCount,
    completionRate,
  });
});

// GET /api/insights/streaks
const getStreaks = asyncHandler(async (req, res) => {
  const habits = await Habit.find({ active: true });

  const habitStreaks = habits.map((habit) => ({
    name: habit.name,
    frequency: habit.frequency,
    ...calculateStreaks(habit.completedDates),
  }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allDates = habits.flatMap((h) =>
    h.completedDates.map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  const uniqueActiveDays = new Set(allDates).size;

  res.status(200).json({
    habits: habitStreaks,
    totalActiveDays: uniqueActiveDays,
  });
});

// GET /api/insights/journal-frequency
const getJournalFrequency = asyncHandler(async (req, res) => {
  const [entriesThisWeek, entriesThisMonth, topMood] = await Promise.all([
    JournalEntry.countDocuments({ createdAt: { $gte: startOfWeek() } }),
    JournalEntry.countDocuments({ createdAt: { $gte: startOfMonth() } }),
    JournalEntry.aggregate([
      { $group: { _id: "$mood", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
  ]);

  res.status(200).json({
    entriesThisWeek,
    entriesThisMonth,
    mostCommonMood: topMood[0]?._id || null,
  });
});

// GET /api/insights/habit-consistency
const getHabitConsistency = asyncHandler(async (req, res) => {
  const habits = await Habit.find({ active: true });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const habitStats = habits.map((habit) => {
    const created = new Date(habit.createdAt);
    created.setHours(0, 0, 0, 0);
    const daysSinceCreation = Math.max(1, Math.round((today - created) / DAY_MS) + 1);
    const completedCount = habit.completedDates.length;
    const consistencyRate = Math.round((completedCount / daysSinceCreation) * 1000) / 10;

    return {
      name: habit.name,
      frequency: habit.frequency,
      completedCount,
      daysSinceCreation,
      consistencyRate,
    };
  });

  const overallConsistencyRate =
    habitStats.length > 0
      ? Math.round(
          (habitStats.reduce((sum, h) => sum + h.consistencyRate, 0) / habitStats.length) * 10
        ) / 10
      : 0;

  res.status(200).json({
    habits: habitStats,
    overallConsistencyRate,
  });
});

// GET /api/insights/mood-summary
const getMoodSummary = asyncHandler(async (req, res) => {
  const [allMoods, topMoodThisMonth] = await Promise.all([
    MoodEntry.find().sort("date"),
    MoodEntry.aggregate([
      { $match: { date: { $gte: startOfMonth() } } },
      { $group: { _id: "$mood", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
  ]);

  const averageScore =
    allMoods.length > 0
      ? Math.round(
          (allMoods.reduce((sum, e) => sum + MOOD_SCORES[e.mood], 0) / allMoods.length) * 10
        ) / 10
      : null;

  let trend = null;
  if (allMoods.length >= 4) {
    const mid = Math.floor(allMoods.length / 2);
    const firstAvg =
      allMoods.slice(0, mid).reduce((sum, e) => sum + MOOD_SCORES[e.mood], 0) / mid;
    const secondAvg =
      allMoods.slice(mid).reduce((sum, e) => sum + MOOD_SCORES[e.mood], 0) /
      (allMoods.length - mid);

    if (secondAvg > firstAvg + 0.3) trend = "improving";
    else if (secondAvg < firstAvg - 0.3) trend = "declining";
    else trend = "stable";
  }

  res.status(200).json({
    averageScore,
    mostFrequentMoodThisMonth: topMoodThisMonth[0]?._id || null,
    trend,
    totalEntries: allMoods.length,
  });
});

module.exports = {
  getOverview,
  getProductivity,
  getStreaks,
  getJournalFrequency,
  getHabitConsistency,
  getMoodSummary,
};
