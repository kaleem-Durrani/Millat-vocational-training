import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import asyncHandler from "../middleware/asyncHandler.js";
import { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "../utils/sendEmail.js";
import { generateOTP } from "../utils/generateOTP.js";
import { ValidationError, NotFoundError, ForbiddenError, AuthenticationError } from "../utils/customErrors.js";
import { parseValidationErrors } from "../utils/validationErrorParser.js";
import { generateAccessToken, generateRefreshToken, clearTokens, setTokens } from "../utils/tokenUtils.js";
import { withTransaction } from "../utils/transactionUtils.js";

// @desc    Register a new student
// @route   POST /api/auth/student/signup
// @access  Public
export const signupStudent = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw parseValidationErrors(errors);
  }

  const { email, password, name, enrollmentNo, departmentId, phoneNumber } = req.body;

  // Generate OTP
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Use transaction utility for the entire process
  const result = await withTransaction(async (tx) => {
    // Check if student already exists
    const studentExists = await tx.student.findFirst({
      where: {
        OR: [{ email }, { enrollmentNo }],
      },
    });

    if (studentExists) {
      throw new ValidationError({
        email: ["Student already exists with this email or enrollment number"],
      });
    }

    // Check if department exists
    const departmentExists = await tx.department.findUnique({
      where: { id: departmentId },
    });

    if (!departmentExists) {
      throw new ValidationError({
        departmentId: ["Department not found"],
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create student
    const newStudent = await tx.student.create({
      data: {
        email,
        password: hashedPassword,
        name,
        enrollmentNo,
        departmentId,
        phoneNumber,
        otp,
        otpExpiry,
      },
    });

    // Send OTP email
    await sendVerificationEmail(
      email,
      otp,
      name
    );

    // Generate tokens
    const accessToken = generateAccessToken(newStudent.id, 'student');
    const refreshToken = generateRefreshToken();

    // Store refresh token in database
    await tx.refreshToken.create({
      data: {
        token: refreshToken,
        studentId: newStudent.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      student: newStudent,
      accessToken,
      refreshToken
    };
  });

  // Set tokens in cookies (this has to be outside the transaction as it modifies the response)
  setTokens(res, result.accessToken, result.refreshToken);

  // Extract student from result
  const student = result.student;

  res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email.",
    data: {
      id: student.id,
      name: student.name,
      email: student.email,
      isVerified: student.isVerified,
      userType: 'student'
    },
  });
});

// @desc    Login student
// @route   POST /api/auth/student/login
// @access  Public
export const loginStudent = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw parseValidationErrors(errors);
  }

  const { email, password } = req.body;

  // Use transaction utility for the entire process
  const result = await withTransaction(async (tx) => {
    // Find student by email
    const student = await tx.student.findUnique({
      where: { email },
    });

    if (!student) {
      throw new AuthenticationError("Invalid credentials");
    }

    // Check if student is banned
    if (student.isBanned) {
      throw new AuthenticationError("Your account has been banned");
    }

    // Check password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      throw new AuthenticationError("Invalid credentials");
    }

    // Generate tokens
    const accessToken = generateAccessToken(student.id, 'student');
    const refreshToken = generateRefreshToken();

    // Store refresh token in database
    await tx.refreshToken.create({
      data: {
        token: refreshToken,
        studentId: student.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      student,
      accessToken,
      refreshToken
    };
  });

  // Set tokens in cookies (this has to be outside the transaction as it modifies the response)
  setTokens(res, result.accessToken, result.refreshToken);

  // Extract student from result
  const student = result.student;

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      id: student.id,
      name: student.name,
      email: student.email,
      isVerified: student.isVerified,
      userType: 'student'
    },
  });
});

// @desc    Logout student
// @route   POST /api/auth/student/logout
// @access  Private
export const logoutStudent = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  // Use transaction utility
  await withTransaction(async (tx) => {
    // Delete refresh token from database if it exists
    if (refreshToken && req.student?.id) {
      await tx.refreshToken.deleteMany({
        where: { studentId: req.student.id }
      });
    }
  });

  // Clear cookies (outside transaction as it modifies the response)
  clearTokens(res);

  res.status(200).json({
    success: true,
    message: "Logout successful",
    data: null,
  });
});

// @desc    Verify OTP
// @route   POST /api/auth/student/verify-otp
// @access  Public
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw parseValidationErrors(errors);
  }

  const { email, otp } = req.body;

  // Use transaction utility
  await withTransaction(async (tx) => {
    const student = await tx.student.findUnique({
      where: { email },
    });

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    if (student.isVerified) {
      throw new ValidationError({
        email: ["Email is already verified"],
      });
    }

    if (!student.otp || !student.otpExpiry) {
      throw new ValidationError({
        otp: ["No OTP found. Please request a new one"],
      });
    }

    if (student.otp !== otp) {
      throw new ValidationError({
        otp: ["Invalid OTP"],
      });
    }

    if (new Date() > student.otpExpiry) {
      throw new ValidationError({
        otp: ["OTP has expired"],
      });
    }

    await tx.student.update({
      where: { email },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
      },
    });
  });

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
    data: null
  });
});

// @desc    Resend OTP
// @route   POST /api/auth/student/resend-otp
// @access  Public
export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw parseValidationErrors(errors);
  }

  const { email } = req.body;
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

  // Use transaction utility
  await withTransaction(async (tx) => {
    const student = await tx.student.findUnique({
      where: { email },
    });

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    if (student.isVerified) {
      throw new ValidationError({
        email: ["Email is already verified"],
      });
    }

    if (student.otpExpiry && new Date() < student.otpExpiry) {
      throw new ValidationError({
        email: ["Please wait for the previous OTP to expire"],
      });
    }

    await tx.student.update({
      where: { email },
      data: {
        otp,
        otpExpiry,
      },
    });

    // Send OTP email inside transaction
    await sendVerificationEmail(
      email,
      otp,
      student.name
    );
  });

  res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    data: null
  });
});

// @desc    Forgot password
// @route   POST /api/auth/student/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw parseValidationErrors(errors);
  }

  const { email } = req.body;
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

  // Use transaction utility
  await withTransaction(async (tx) => {
    const student = await tx.student.findUnique({
      where: { email },
    });

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    if (student.otpExpiry && new Date() < student.otpExpiry) {
      throw new ValidationError({
        email: ["Please wait for the previous OTP to expire"],
      });
    }

    await tx.student.update({
      where: { email },
      data: {
        otp,
        otpExpiry,
      },
    });

    // Send OTP email inside transaction
    await sendPasswordResetEmail(
      email,
      otp,
      student.name
    );
  });

  res.status(200).json({
    success: true,
    message: "Password reset OTP sent successfully",
    data: null
  });
});

// @desc    Reset password
// @route   POST /api/auth/student/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw parseValidationErrors(errors);
  }

  const { email, otp, newPassword } = req.body;

  // Use transaction utility
  await withTransaction(async (tx) => {
    const student = await tx.student.findUnique({
      where: { email },
    });

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    if (!student.otp || !student.otpExpiry) {
      throw new ValidationError({
        otp: ["No OTP found. Please request a password reset"],
      });
    }

    if (student.otp !== otp) {
      throw new ValidationError({
        otp: ["Invalid OTP"],
      });
    }

    if (new Date() > student.otpExpiry) {
      throw new ValidationError({
        otp: ["OTP has expired"],
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await tx.student.update({
      where: { email },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiry: null,
      },
    });
  });

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
    data: null
  });
});
