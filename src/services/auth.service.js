import { ApiError } from '../utils/ApiError.js'
import { HTTP } from '../constants/httpStatus.js'
import { User } from '../models/User.model.js'
import { generateToken } from '../utils/generateToken.js'

export async function login(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(HTTP.UNAUTHORIZED, 'Incorrect email or password')
  }

  const token = generateToken({ id: user._id.toString() })
  return { token, user: user.toSafeObject() }
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(HTTP.NOT_FOUND, 'User not found')
  }
  return user.toSafeObject()
}
