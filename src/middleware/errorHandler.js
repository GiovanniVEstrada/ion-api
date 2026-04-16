const errorHandler = (err, req, res, next) => {
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({ message: "Invalid task ID" });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: err.message || "Server error" });
};

module.exports = errorHandler;