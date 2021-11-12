const router = require("express").Router();
const TodoList = require("../models/TodoList");
const { verifyToken } = require("../helpers/accessControl");

router.get("/", verifyToken, async (req, res) => {
  try {
    const todoLists = await TodoList.find({ user: req.user._id });
    res.status(200).json(todoLists);
  } catch (error) {
    res.status(400).json({ name: error.name, message: error.message });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const todoList = await TodoList.findById(req.params.id);
    if (todoList) {
      if (todoList.user == req.user._id) {
        res.status(200).json(todoList);
      } else {
        res.status(403).json({ message: "Not allowed." });
      }
    } else {
      res.status(404).json({ message: "Not found." });
    }
  } catch (error) {
    res.status(400).json({ name: error.name, message: error.message });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, todos } = req.body;
    const todoList = new TodoList({ user: req.user._id, title, todos });
    await todoList.save();
    res.status(201).json(todoList);
  } catch (error) {
    res.status(400).json({ name: error.name, message: error.message });
  }
});

router.post("/addto/:id", verifyToken, async (req, res) => {
  try {
    const todoList = await TodoList.findById(req.params.id);
    if (todoList) {
      if (todoList.user == req.user._id) {
        todoList.todos.push({ text: req.body.text });
        await todoList.save();
        res.status(200).json(todoList);
      } else {
        res.status(403).json({ message: "Not allowed." });
      }
    } else {
      res.status(404).json({ message: "Not found." });
    }
  } catch (error) {
    res.status(400).json({ name: error.name, message: error.message });
  }
});

router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const todoList = await TodoList.findById(req.params.id);
    if (todoList) {
      if (todoList.user == req.user._id) {
        await todoList.updateOne(req.body);
        res.status(200).json({ ...todoList.toObject(), ...req.body });
      } else {
        res.status(403).json({ message: "Not allowed." });
      }
    } else {
      res.status(404).json({ message: "Not found." });
    }
  } catch (error) {
    res.status(400).json({ name: error.name, message: error.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const todoList = await TodoList.findById(req.params.id);
    if (todoList) {
      if (todoList.user == req.user._id) {
        await todoList.deleteOne();
        res.status(204).json({ message: "Deleted successfully." });
      } else {
        res.status(403).json({ messge: "Not allowed." });
      }
    } else {
      res.status(404).json({ message: "Not found." });
    }
  } catch (error) {
    res.status(400).json({ name: error.name, message: error.message });
  }
});

router.delete("/from/:id/:todo", verifyToken, async (req, res) => {
  try {
    const todoList = await TodoList.findById(req.params.id);
    if (todoList) {
      if (todoList.user == req.user._id) {
        if (isNaN(req.params.todo)) {
          todoList.todos = todoList.todos.filter((item) => item._id != req.params.todo);
        } else {
          todoList.todos.splice(req.params.todo, 1);
        }
        await todoList.save();
        res.status(200).json(todoList);
      } else {
        res.status(403).json({ messge: "Not allowed." });
      }
    } else {
      res.status(404).json({ message: "Not found." });
    }
  } catch (error) {
    res.status(400).json({ name: error.name, message: error.message });
  }
});

module.exports = router;
