import { Collection } from "../models/Collection.model.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP } from "../constants/httpStatus.js";
import { ROLES } from "../constants/roles.js";
import { ACCOUNT_STATUS } from "../constants/collection.js";
import * as flutterwaveService from "./flutterwave.js";
import * as userService from "./user.service.js";

// Calls Flutterwave to create a customer + dedicated virtual account for a collection,
// then persists the result. Any failure marks the collection accountStatus 'failed'
// so the frontend can offer a retry — it never throws back to the caller.
// bvn is passed through only, never stored on the collection or user record.
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
