import express from "express";
import {
  getProfile,
  updateProfile,
  getMyCourses,
  getCourseDetails,
  getCourseStudents,
  updateEnrollmentStatus,
  getCourseResources,
  createResource,
  updateResource,
  deleteResource,
  getResourceComments,
  createResourceComment,
  updateResourceComment,
  deleteResourceComment,
} from "../controllers/teacher.controller.js";
import {
  updateProfileValidation,
  updateEnrollmentStatusValidation,
} from "../routesValidation/teacher.validation.js";
import {
  createResourceValidation,
  updateResourceValidation,
} from "../routesValidation/resource.validation.js";
import { protectTeacherRoute } from "../middleware/protectTeacherRoute.js";

const router = express.Router();

// Profile Management
router.get("/profile", protectTeacherRoute, getProfile);
router.put("/profile", protectTeacherRoute, updateProfileValidation, updateProfile);

// Course Management
router.get("/courses", protectTeacherRoute, getMyCourses);
router.get("/courses/:id", protectTeacherRoute, getCourseDetails);
router.get("/courses/:id/students", protectTeacherRoute, getCourseStudents);
router.put(
  "/courses/:courseId/enrollments/:enrollmentId",
  protectTeacherRoute,
  updateEnrollmentStatusValidation,
  updateEnrollmentStatus
);

// Resource Management
router.get("/courses/:id/resources", protectTeacherRoute, getCourseResources);
router.post("/resources", protectTeacherRoute, createResourceValidation, createResource);
router.put("/resources/:id", protectTeacherRoute, updateResourceValidation, updateResource);
router.delete("/resources/:id", protectTeacherRoute, deleteResource);
router.get("/resources/:id/comments", protectTeacherRoute, getResourceComments);
router.post("/resources/:id/comments", protectTeacherRoute, createResourceComment);
router.put("/resources/comments/:commentId", protectTeacherRoute, updateResourceComment);
router.delete("/resources/comments/:commentId", protectTeacherRoute, deleteResourceComment);

export default router;
