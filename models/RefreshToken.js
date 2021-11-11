const mongoose = require("mongoose");

const refreshTokenSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  jwtPayload: Object,
  issuedAt: Date,
});

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
