import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES } from "../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 4,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      // required for debtors — Paystack needs it to create a dedicated account.
      // not required for admin.
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.DEBTOR,
    },
    collection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    email: this.email,
    phone: this.phone ?? undefined,
    role: this.role,
    collectionId: this.collection ? this.collection.toString() : undefined,
  };
};

export const User = mongoose.model("User", userSchema);
