const express = require("express");
const cors = require("cors");

const taskRoutes = require("./routes/taskRoutes");
const journalRoutes = require("./routes/journalRoutes");
const habitRoutes = require("./routes/habitRoutes");
const moodRoutes = require("./routes/moodRoutes");
const insightRoutes = require("./routes/insightRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Ion API is running." });
});

app.use("/api/tasks", taskRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/insights", insightRoutes);

app.use(errorHandler);

module.exports = app;