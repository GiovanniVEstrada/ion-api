const Task = require("../models/Task");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/paginate");

const getTasks = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.completed !== undefined) {
    filter.completed = req.query.completed === "true";
  }
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }

  const sortField = req.query.sort || "-createdAt";
  const { skip, limit, buildResponse } = paginate(req.query);

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(sortField).skip(skip).limit(limit),
    Task.countDocuments(filter),
  ]);

  res.status(200).json(buildResponse(tasks, total));
});

const createTask = asyncHandler(async (req, res) => {
  const { title, priority, category, dueDate } = req.body || {};

  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }

  const task = await Task.create({ title, priority, category, dueDate });
  res.status(201).json(task);
});

const updateTask = asyncHandler(async (req, res) => {
  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedTask) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.status(200).json(updatedTask);
});

const deleteTask = asyncHandler(async (req, res) => {
  const deletedTask = await Task.findByIdAndDelete(req.params.id);

  if (!deletedTask) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.status(200).json({ message: "Task deleted successfully" });
});

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
