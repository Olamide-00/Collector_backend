import mongoose from "mongoose";
import { ROLES } from "../constants/roles.js";
import { PAYMENT_SOURCE } from "../constants/collection.js";

const paymentSchema = new mongoose.Schema(
  {
    collection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    paymentTime: {
      type: String, // HH:mm
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    recordedByEmail: {
      type: String,
      required: true,
    },
    recordedByRole: {
      type: String,
      enum: [...Object.values(ROLES), "system"],
      required: true,
    },
    source: {
      type: String,
      enum: Object.values(PAYMENT_SOURCE),
      default: PAYMENT_SOURCE.MANUAL,
    },
    paystackReference: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.collectionId = ret.collection
          ? ret.collection.toString()
          : undefined;
        delete ret._id;
        delete ret.collection;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Payment = mongoose.model("Payment", paymentSchema);
