import { ApiError } from "../utils/ApiError.js";
import { HTTP } from "../constants/httpStatus.js";
import { verifyToken } from "../utils/generateToken.js";
import { User } from "../models/User.model.js";
import { catchAsync } from "../utils/catchAsync.js";

export const protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(HTTP.UNAUTHORIZED, "Authentication required");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new ApiError(HTTP.UNAUTHORIZED, "Invalid or expired token");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(HTTP.UNAUTHORIZED, "User no longer exists");
  }

  req.user = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    collectionIds: user.collections.map((id) => id.toString()),
  };

  next();
});
