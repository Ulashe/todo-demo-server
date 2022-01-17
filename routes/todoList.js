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

router.post("/:id/todo", verifyToken, async (req, res) => {
  try {
    const todoList = await TodoList.findById(req.params.id);
    if (todoList) {
      if (todoList.user == req.user._id) {
        if (req.body.text.length > 0) {
          todoList.todos.push({ text: req.body.text });
          await todoList.save();
          res.status(200).json(todoList);
        } else {
          res.status(422).json({ message: "Text cannot be empty!" });
        }
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
        if (req.body.title && req.body.title.length == 0) {
          res.status(422).json({ message: "Title cannot be empty!" });
        } else {
          await todoList.updateOne(req.body);
          res.status(200).json({ ...todoList.toObject(), ...req.body });
        }
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

router.patch("/:id/todo", verifyToken, async (req, res) => {
  try {
    const todoList = await TodoList.findById(req.params.id);
    if (todoList) {
      if (todoList.user == req.user._id) {
        const index = todoList.todos.findIndex((todo) => todo._id == req.body.todo._id);
        if (index + 1) {
          if (req.body.todo.text.length > 0) {
            todoList.todos[index] = req.body.todo;
            await todoList.save();
            res.status(200).json(todoList);
          } else {
            res.status(422).json({ message: "Text cannot be empty!" });
          }
        } else {
          res.status(404).json({ message: "Todo not found." });
        }
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
        res.status(204).json();
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

router.delete("/:id/todo", verifyToken, async (req, res) => {
  try {
    const todoList = await TodoList.findById(req.params.id);
    if (todoList) {
      if (todoList.user == req.user._id) {
        todoList.todos = todoList.todos.filter((todo) => todo._id != req.body.todo._id);
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
