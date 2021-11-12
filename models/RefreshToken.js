const mongoose = require("mongoose");

const refreshTokenSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    jwtPayload: Object,
    issuedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
