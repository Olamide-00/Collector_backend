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

  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    const alreadyLinked = user.collections.some(
      (id) => id.toString() === collectionId.toString()
    );
    if (!alreadyLinked) {
      user.collections.push(collectionId);
    }
    if (phone && !user.phone) {
      user.phone = phone;
    }
    await user.save();
  } else {
    user = await User.create({
      email: normalizedEmail,
      password,
      phone,
      role: ROLES.DEBTOR,
      collections: [collectionId],
    });
  }

  return user.toSafeObject();
}

export async function getUserForCollection(collectionId) {
  const user = await User.findOne({ collections: collectionId });
  return user ? user.toSafeObject() : null;
}
