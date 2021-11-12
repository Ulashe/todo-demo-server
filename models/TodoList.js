const mongoose = require("mongoose");

const todoList = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    todos: [{ text: String, isCompleted: { type: Boolean, default: false } }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("TodoList", todoList);
