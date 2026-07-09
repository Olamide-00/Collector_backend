import { catchAsync } from '../utils/catchAsync.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { HTTP } from '../constants/httpStatus.js'
import * as authService from '../services/auth.service.js'

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body
  const { token, user } = await authService.login(email, password)
  sendSuccess(res, HTTP.OK, 'Logged in successfully', { token, user })
})

export const getMe = catchAsync(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id)
  sendSuccess(res, HTTP.OK, 'Current user fetched', { user })
})
