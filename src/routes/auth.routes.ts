import { Router } from "express";
import {
  adminResetPassword,
  createVendor,
  forgotPassword,
  getAdminBankDetails,
  getAllVendors,
  getMe,
  getUserActivity,
  getVendorCredentials,
  login,
  logout,
  refreshToken,
  resetPassword,
  updateAdminBankDetails,
  updateVendor,
} from "../controllers/auth.controller";
import { authenticate, requireRole } from "../middlewares/auth";
import { UserRole } from "../types";

const router = Router();

router.post("/login", login);
router.post(
  "/create-vendor",
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  createVendor,
);
router.get("/me", authenticate, getMe);
router.get(
  "/vendors",
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  getAllVendors,
);
router.get(
  "/vendors/:id/credentials",
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  getVendorCredentials,
);
router.put(
  "/vendors/:id",
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  updateVendor,
);
router.get("/admin/bank-details", authenticate, getAdminBankDetails);
router.put(
  "/admin/bank-details",
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  updateAdminBankDetails,
);
router.post("/reset-password", authenticate, resetPassword);
router.post(
  "/admin/reset-password",
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  adminResetPassword,
);
router.post("/forgot-password", forgotPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticate, logout);
router.get("/activity/:userId", authenticate, getUserActivity);

export default router;
