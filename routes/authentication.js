const router = require("express").Router();
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ac = require("../helpers/accessControl");

const expiresInSeconds = 60 * 2;

const errors = [
  { code: 0, field: "email", reason: "Email is invalid." },
  { code: 1, field: "email", reason: "Email already exists." },
  { code: 2, field: "email", reason: "Email not found." },
  { code: 3, field: "password", reason: "Password is invalid, must be at least 6 digits." },
  { code: 4, field: "password", reason: "Password is wrong." },
  { code: 5, field: "newPassword", reason: "New password is invalid, must be at least 6 digits." },
];

// Sign Up
router.post("/signup", async (req, res) => {
  try {
    // Check if the email is valid
    const emailRegex = new RegExp(
      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g
    );
    if (!emailRegex.test(req.body.email)) return res.status(422).json({ errors, error: errors[0] });

    // Check if the user is already in the database
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) return res.status(422).json({ errors, error: errors[1] });

    // Check if the password is at least 6 characters
    if (req.body.password.length < 6) return res.status(422).json({ errors, error: errors[3] });

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
    // Check if the email is valid
    const emailRegex = new RegExp(
      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g
    );
    if (!emailRegex.test(req.body.email)) return res.status(422).json({ errors, error: errors[0] });

    // Check if the email exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(422).json({ errors, error: errors[2] });

    // Check if the password is at least 6 characters
    if (req.body.password.length < 6) return res.status(422).json({ errors, error: errors[3] });

    // Check if the password is correct
    const validPasword = await bcrypt.compare(req.body.password, user.password);
    if (!validPasword) return res.status(422).json({ errors, error: errors[4] });

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

router.post("/changepassword", ac.verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (req.body.password.length < 6) return res.status(422).json({ errors, error: errors[3] });
    if (req.body.newPassword.length < 6) return res.status(422).json({ errors, error: errors[5] });

    const validPasword = await bcrypt.compare(req.body.password, user.password);
    if (!validPasword) return res.status(422).json({ errors, error: errors[4] });

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    await RefreshToken.deleteMany({ user: user._id, _id: { $ne: req.body.refreshToken } });

    res.status(200).json({
      message:
        "Password changed successfully. Except for this client's refreshToken, all other refreshTokens belong to the user deleted. This means that all sessions other than this session closed.",
    });
  } catch (error) {
    res.status(400).json({ name: error.name, message: error.message });
  }
});

module.exports = router;
