import mongoose from "mongoose";
import { Collection } from "../models/Collection.model.js";
import { Payment } from "../models/Payment.model.js";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP } from "../constants/httpStatus.js";
import { ROLES } from "../constants/roles.js";
import { ACCOUNT_STATUS } from "../constants/collection.js";
import * as flutterwaveService from "./flutterwave.js";
import * as userService from "./user.service.js";


async function provisionDedicatedAccount(
  collection,
  customerEmail,
  customerPhone,
  bvn
) {
  try {
    const customer = await flutterwaveService.createCustomer({
      email: customerEmail,
      name: collection.name,
      phone: customerPhone,
    });
    const dva = await flutterwaveService.createDedicatedVirtualAccount(
      customer.id,
      bvn
    );

    collection.paymentAccount = {
      bankName: dva.account_bank_name,
      accountNumber: dva.account_number,
      accountName: collection.name,
      flutterwaveCustomerId: customer.id,
      flutterwaveVirtualAccountId: dva.id,
    };
    collection.accountStatus = ACCOUNT_STATUS.ACTIVE;
  } catch (err) {
    collection.accountStatus = ACCOUNT_STATUS.FAILED;
    console.error("Dedicated account provisioning failed:", err.message);
  }
  await collection.save();
}

export async function createCollection(
  { name, totalAmount, loginEmail, loginPassword, loginPhone, loginBvn },
  adminId
) {
  const collection = await Collection.create({
    name,
    totalAmount,
    collectedAmount: 0,
    remainingAmount: totalAmount,
    createdBy: adminId,
  });

  // The collection is already persisted at this point. If assigning the
  // debtor login fails for any reason (validation error, etc.), we must not
  // leave an orphaned collection with no user attached to it — roll it back
  // and surface a clear error instead.
  try {
    await userService.assignDebtorLogin(
      collection._id,
      loginEmail,
      loginPassword,
      loginPhone
    );
  } catch (err) {
    await Collection.findByIdAndDelete(collection._id);
    throw err;
  }

  await provisionDedicatedAccount(collection, loginEmail, loginPhone, loginBvn);

  return collection;
}

export async function retryAccountCreation(collectionId, bvn) {
  const collection = await Collection.findById(collectionId);
  if (!collection) {
    throw new ApiError(HTTP.NOT_FOUND, "Collection not found");
  }

  const user = await userService.getUserForCollection(collectionId);
  if (!user) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      "This collection has no login assigned yet — assign one before creating an account"
    );
  }
  if (!user.phone) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      "This collection's login has no phone number on file — reset the login with a phone number first"
    );
  }
  if (!bvn) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      "A BVN or NIN is required to create a static virtual account"
    );
  }

  collection.accountStatus = ACCOUNT_STATUS.CREATING;
  await collection.save();
  await provisionDedicatedAccount(collection, user.email, user.phone, bvn);
  return collection;
}

export async function getAllCollections() {
  return Collection.find().sort({ createdAt: -1 });
}

export async function getCollectionById(id, requestingUser) {
  const collection = await Collection.findById(id);
  if (!collection) {
    throw new ApiError(HTTP.NOT_FOUND, "Collection not found");
  }

  const isOwner = requestingUser.collectionIds?.includes(id);

  if (requestingUser.role !== ROLES.ADMIN && !isOwner) {
    throw new ApiError(
      HTTP.FORBIDDEN,
      "You do not have access to this collection"
    );
  }

  return collection;
}

// Admin-only. Deletes the collection along with all of its payment history,
// and pulls the collection's id out of any user's `collections` array so no
// debtor login is left pointing at a deleted collection.
//
// NOT run inside a transaction — this assumes a standalone MongoDB instance,
// which doesn't support multi-document transactions. Operations are ordered
// so the collection document itself is deleted LAST: if something fails
// partway through, you're left with an orphaned-but-still-referenced
// collection (safe, visible, retryable) rather than payments or user
// references pointing at a collection that no longer exists.
//
// If this ever moves to a replica set, wrap these three calls in
// `session.withTransaction()` instead.

export async function deleteCollection(id) {
  const collection = await Collection.findById(id);
  if (!collection) {
    throw new ApiError(HTTP.NOT_FOUND, "Collection not found");
  }

  await Payment.deleteMany({ collection: id });
  await User.updateMany({ collections: id }, { $pull: { collections: id } });
  await Collection.findByIdAndDelete(id);
}

export async function getTotals() {
  const collections = await Collection.find();

  return collections.reduce(
    (acc, c) => {
      acc.totalCollections += 1;
      acc.totalExpected += c.totalAmount;
      acc.totalCollected += c.collectedAmount;
      acc.totalRemaining += c.remainingAmount;
      if (c.status === "Completed") acc.completedCollections += 1;
      else acc.activeCollections += 1;
      return acc;
    },
    {
      totalCollections: 0,
      totalExpected: 0,
      totalCollected: 0,
      totalRemaining: 0,
      activeCollections: 0,
      completedCollections: 0,
    }
  );
}