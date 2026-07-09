import mongoose from 'mongoose'
import { COLLECTION_STATUS, ACCOUNT_STATUS } from '../constants/collection.js'

const paymentAccountSchema = new mongoose.Schema(
  {
    bankName: String,
    accountNumber: String,
    accountName: String,
    paystackCustomerCode: String,
    paystackDedicatedAccountId: String,
  },
  { _id: false }
)

const collectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    collectedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(COLLECTION_STATUS),
      default: COLLECTION_STATUS.PENDING,
    },
    accountStatus: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.CREATING,
    },
    paymentAccount: {
      type: paymentAccountSchema,
      default: undefined,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

export const Collection = mongoose.model('Collection', collectionSchema)
