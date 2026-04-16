const express = require("express");
const {
  getMoods,
  createMood,
  updateMood,
  deleteMood,
} = require("../controllers/moodController");

const router = express.Router();

router.get("/", getMoods);
router.post("/", createMood);
router.patch("/:id", updateMood);
router.delete("/:id", deleteMood);

module.exports = router;
