const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const user = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
}

module.exports = { verifyToken };
