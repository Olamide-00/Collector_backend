import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP } from "../constants/httpStatus.js";
import * as collectionService from "../services/collection.service.js";

export const createCollection = catchAsync(async (req, res) => {
  const collection = await collectionService.createCollection(
    req.body,
    req.user.id
  );
  sendSuccess(res, HTTP.CREATED, "Collection created", { collection });
});

export const getCollections = catchAsync(async (req, res) => {
  const collections = await collectionService.getAllCollections();
  const totals = await collectionService.getTotals();
  sendSuccess(res, HTTP.OK, "Collections fetched", { collections, totals });
});

export const getCollection = catchAsync(async (req, res) => {
  const collection = await collectionService.getCollectionById(
    req.params.id,
    req.user
  );
  sendSuccess(res, HTTP.OK, "Collection fetched", { collection });
});

export const retryAccount = catchAsync(async (req, res) => {
  const collection = await collectionService.retryAccountCreation(
    req.params.id,
    req.body.bvn
  );
  sendSuccess(res, HTTP.OK, "Account creation retried", { collection });
});
