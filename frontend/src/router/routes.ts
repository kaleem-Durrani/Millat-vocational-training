import React, { lazy } from 'react';
import { ROUTES } from '../common/constants/routes';

// Define route types
export type RouteType = {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  protected?: boolean;
  userType?: 'admin' | 'teacher' | 'student';
};

// Lazy load components
const Home = lazy(() => import('../pages').then((module) => ({ default: module.Home })));
const Login = lazy(() => import('../pages').then((module) => ({ default: module.Login })));
const Register = lazy(() => import('../pages').then((module) => ({ default: module.Register })));
const VerifyEmail = lazy(() => import('../pages').then((module) => ({ default: module.VerifyEmail })));
const ForgotPassword = lazy(() => import('../pages').then((module) => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import('../pages').then((module) => ({ default: module.ResetPassword })));

// Admin pages
const AdminDashboard = lazy(() => import('../pages').then((module) => ({ default: module.AdminDashboard })));
const AdminTeachers = lazy(() => import('../pages').then((module) => ({ default: module.AdminTeachers })));
const AdminStudents = lazy(() => import('../pages').then((module) => ({ default: module.AdminStudents })));
const AdminDepartments = lazy(() => import('../pages').then((module) => ({ default: module.AdminDepartments })));
const AdminNewsEvents = lazy(() => import('../pages').then((module) => ({ default: module.AdminNewsEvents })));
const AdminProfile = lazy(() => import('../pages').then((module) => ({ default: module.AdminProfile })));
const AdminConversations = lazy(() => import('../pages').then((module) => ({ default: module.AdminConversations })));

// Teacher pages
const TeacherDashboard = lazy(() => import('../pages').then((module) => ({ default: module.TeacherDashboard })));
const TeacherCourses = lazy(() => import('../pages').then((module) => ({ default: module.TeacherCourses })));
const TeacherResources = lazy(() => import('../pages').then((module) => ({ default: module.TeacherResources })));
const TeacherProfile = lazy(() => import('../pages').then((module) => ({ default: module.TeacherProfile })));
const TeacherConversations = lazy(() => import('../pages').then((module) => ({ default: module.TeacherConversations })));

// Student pages
const StudentDashboard = lazy(() => import('../pages').then((module) => ({ default: module.StudentDashboard })));
const StudentCourses = lazy(() => import('../pages').then((module) => ({ default: module.StudentCourses })));
const StudentResources = lazy(() => import('../pages').then((module) => ({ default: module.StudentResources })));
const StudentProfile = lazy(() => import('../pages').then((module) => ({ default: module.StudentProfile })));
const StudentConversations = lazy(() => import('../pages').then((module) => ({ default: module.StudentConversations })));

// Error pages
const NotFound = lazy(() => import('../pages').then((module) => ({ default: module.NotFound })));
const Unauthorized = lazy(() => import('../pages').then((module) => ({ default: module.Unauthorized })));
const Forbidden = lazy(() => import('../pages').then((module) => ({ default: module.Forbidden })));
const ServerError = lazy(() => import('../pages').then((module) => ({ default: module.ServerError })));

// Public routes
export const publicRoutes: RouteType[] = [
  { path: ROUTES.HOME, component: Home },
  { path: ROUTES.LOGIN, component: Login },
  { path: ROUTES.REGISTER, component: Register },
  { path: ROUTES.VERIFY_EMAIL, component: VerifyEmail },
  { path: ROUTES.FORGOT_PASSWORD, component: ForgotPassword },
  { path: ROUTES.RESET_PASSWORD, component: ResetPassword },
];

// Admin routes
export const adminRoutes: RouteType[] = [
  { path: ROUTES.ADMIN.DASHBOARD, component: AdminDashboard, protected: true, userType: 'admin' },
  { path: ROUTES.ADMIN.TEACHERS, component: AdminTeachers, protected: true, userType: 'admin' },
  { path: ROUTES.ADMIN.STUDENTS, component: AdminStudents, protected: true, userType: 'admin' },
  { path: ROUTES.ADMIN.DEPARTMENTS, component: AdminDepartments, protected: true, userType: 'admin' },
  { path: ROUTES.ADMIN.NEWS_EVENTS, component: AdminNewsEvents, protected: true, userType: 'admin' },
  { path: ROUTES.ADMIN.PROFILE, component: AdminProfile, protected: true, userType: 'admin' },
  { path: ROUTES.ADMIN.CONVERSATIONS, component: AdminConversations, protected: true, userType: 'admin' },
];

// Teacher routes
export const teacherRoutes: RouteType[] = [
  { path: ROUTES.TEACHER.DASHBOARD, component: TeacherDashboard, protected: true, userType: 'teacher' },
  { path: ROUTES.TEACHER.COURSES, component: TeacherCourses, protected: true, userType: 'teacher' },
  { path: ROUTES.TEACHER.RESOURCES, component: TeacherResources, protected: true, userType: 'teacher' },
  { path: ROUTES.TEACHER.PROFILE, component: TeacherProfile, protected: true, userType: 'teacher' },
  { path: ROUTES.TEACHER.CONVERSATIONS, component: TeacherConversations, protected: true, userType: 'teacher' },
];

// Student routes
export const studentRoutes: RouteType[] = [
  { path: ROUTES.STUDENT.DASHBOARD, component: StudentDashboard, protected: true, userType: 'student' },
  { path: ROUTES.STUDENT.COURSES, component: StudentCourses, protected: true, userType: 'student' },
  { path: ROUTES.STUDENT.RESOURCES, component: StudentResources, protected: true, userType: 'student' },
  { path: ROUTES.STUDENT.PROFILE, component: StudentProfile, protected: true, userType: 'student' },
  { path: ROUTES.STUDENT.CONVERSATIONS, component: StudentConversations, protected: true, userType: 'student' },
];

// Error routes
export const errorRoutes: RouteType[] = [
  { path: ROUTES.ERROR.NOT_FOUND, component: NotFound },
  { path: ROUTES.ERROR.UNAUTHORIZED, component: Unauthorized },
  { path: ROUTES.ERROR.FORBIDDEN, component: Forbidden },
  { path: ROUTES.ERROR.SERVER_ERROR, component: ServerError },
];

// All routes combined
export const routes: RouteType[] = [
  ...publicRoutes,
  ...adminRoutes,
  ...teacherRoutes,
  ...studentRoutes,
  ...errorRoutes,
  // Catch-all route for 404
  { path: '*', component: NotFound },
]; 