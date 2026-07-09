import { User } from "../models/User.model.js";
import { Collection } from "../models/Collection.model.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP } from "../constants/httpStatus.js";
import { ROLES } from "../constants/roles.js";

export async function assignDebtorLogin(collectionId, email, password, phone) {
  const collection = await Collection.findById(collectionId);
  if (!collection) {
    throw new ApiError(HTTP.NOT_FOUND, "Collection not found");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const emailOwner = await User.findOne({ email: normalizedEmail });
  if (
    emailOwner &&
    emailOwner.collection?.toString() !== collectionId.toString()
  ) {
    throw new ApiError(
      HTTP.CONFLICT,
      "That email is already in use by another login"
    );
  }

  let user = await User.findOne({ collection: collectionId });
  if (user) {
    user.email = normalizedEmail;
    user.password = password;
    if (phone) user.phone = phone;
    await user.save();
  } else {
    user = await User.create({
      email: normalizedEmail,
      password,
      phone,
      role: ROLES.DEBTOR,
      collection: collectionId,
    });
  }

  return user.toSafeObject();
}

export async function getUserForCollection(collectionId) {
  const user = await User.findOne({ collection: collectionId });
  return user ? user.toSafeObject() : null;
}
