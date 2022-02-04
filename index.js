const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");

dotenv.config();

mongoose.connect(
  process.env.DB_CONNECT,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  () => console.log("connected to db!")
);

mongoose.set("debug", false);

app.use(morgan("dev"));
app.use(express.json());
app.use(cors({ exposedHeaders: "Content-Range,X-Content-Range" }));

app.use("/api/auth", require("./routes/authentication"));
app.use("/api/todolists", require("./routes/todoList"));

app.use((req, res, next) => {
  const error = new Error("Not found!");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: { message: error.message },
  });
});

app.listen(process.env.PORT, () => console.log("Server Up and running, port: " + process.env.PORT));
