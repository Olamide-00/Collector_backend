import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP } from "../constants/httpStatus.js";
import * as userService from "../services/user.service.js";

export const assignLogin = catchAsync(async (req, res) => {
  const { email, password, phone } = req.body;
  const user = await userService.assignDebtorLogin(
    req.params.id,
    email,
    password,
    phone
  );
  sendSuccess(res, HTTP.OK, "Login assigned", { user });
});
