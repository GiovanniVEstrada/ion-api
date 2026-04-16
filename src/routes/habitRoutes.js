const express = require("express");
const {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
} = require("../controllers/habitController");

const router = express.Router();

router.get("/", getHabits);
router.post("/", createHabit);
router.patch("/:id", updateHabit);
router.delete("/:id", deleteHabit);
router.post("/:id/complete", completeHabit);

module.exports = router;
