const router = require("express").Router();
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const expiresInSeconds = 60 * 2;

// Sign Up
router.post("/signup", async (req, res) => {
  try {
    // Check if the user is already in the database
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) return res.status(200).json({ error: "Email is already exists" });

    // Hash passwords
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create new user
    const user = new User({
      email: req.body.email,
      password: hashedPassword,
    });

    await user.save();

    const jwtPayload = { _id: user._id, email: user.email };
    const accessToken = jwt.sign(jwtPayload, process.env.TOKEN_SECRET, {
      expiresIn: expiresInSeconds,
    });
    const refreshToken = new RefreshToken({
      userID: user._id,
      jwtPayload: jwtPayload,
      issuedAt: new Date().toISOString(),
    });
    await refreshToken.save();

    res.status(200).json({
      _id: user._id,
      email: user.email,
      expiresInSeconds: expiresInSeconds,
      accessToken: accessToken,
      refreshToken: refreshToken._id,
    });
  } catch (error) {
    res.status(400).json({ name: error.name, message: error.message });
  }
});

// Sign In
router.post("/signin", async (req, res) => {
  try {
    // Check if the email exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(200).json({ error: "Email doesn't exist" });

    // Check if the password is correct
    const validPasword = await bcrypt.compare(req.body.password, user.password);
    if (!validPasword) return res.status(200).json({ error: "Invalid password" });

    const jwtPayload = { _id: user._id, email: user.email };

    const accessToken = jwt.sign(jwtPayload, process.env.TOKEN_SECRET, {
      expiresIn: expiresInSeconds,
    });

    const refreshToken = new RefreshToken({
      userID: user._id,
      jwtPayload: jwtPayload,
      issuedAt: Date.now(),
    });

    await refreshToken.save();

    res.status(200).json({
      _id: user._id,
      email: user.email,
      expiresInSeconds: expiresInSeconds,
      accessToken: accessToken,
      refreshToken: refreshToken._id,
    });
  } catch (error) {
    res.status(400).json({ name: error.name, message: error.message });
  }
});

router.get("/accesstoken/:id", async (req, res) => {
  try {
    const token = await RefreshToken.findById(req.params.id);
    if (token) {
      const accessToken = jwt.sign(token.jwtPayload, process.env.TOKEN_SECRET, {
        expiresIn: expiresInSeconds,
      });
      res.status(200).json({ accessToken, expiresInSeconds });
    } else {
      res.status(401).json({ message: "The refresh token is invalid " });
    }
  } catch (error) {
    res.status(400).json({ name: error.name, message: error.message });
  }
});

router.get("/refreshtokens/:id", async (req, res) => {
  try {
    const refreshToken = await RefreshToken.findById(req.params.id);
    res.status(200).json(refreshToken);
  } catch (error) {
    res.status(400).json({ name: error.name, message: error.message });
  }
});

router.delete("/refreshtokens/:id", async (req, res) => {
  try {
    await RefreshToken.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Refresh Token deleted successfully" });
  } catch (error) {
    res.status(400).json({ name: error.name, message: error.message });
  }
});

module.exports = router;
