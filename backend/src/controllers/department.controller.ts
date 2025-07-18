import { Request, Response } from "express";
import { validationResult } from "express-validator";
import prisma from "../db/prisma.js";
import { ValidationError, NotFoundError } from "../utils/customErrors.js";
import { parseValidationErrors } from "../utils/validationErrorParser.js";
import asyncHandler from "../middleware/asyncHandler.js";

// @desc    Get all departments
// @route   GET /api/department
// @access  Public
export const getAllDepartments = asyncHandler(async (req: Request, res: Response) => {
  const { search, page = '1', limit = '10' } = req.query;

  // Pagination
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Build where clause for filtering
  const where: any = {};

  // Search filter (name or description)
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  // Get departments and total count in parallel
  const [departments, total] = await Promise.all([
    prisma.department.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            teachers: true,
            students: true,
            courses: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      skip,
      take: limitNum,
    }),
    prisma.department.count({ where }),
  ]);

  const hasMore = skip + departments.length < total;

  res.status(200).json({
    success: true,
    message: "Departments retrieved successfully",
    data: {
      items: departments,
      total,
      page: pageNum,
      limit: limitNum,
      hasMore,
    },
  });
});

// @desc    Get departments for select components (id and name only)
// @route   GET /api/departments/select
// @access  Public
export const getDepartmentsForSelect = asyncHandler(async (req: Request, res: Response) => {
  const departments = await prisma.department.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Transform to value/label format for select components
  const selectOptions = departments.map(dept => ({
    value: dept.id,
    label: dept.name,
  }));

  res.status(200).json({
    success: true,
    message: "Departments for select retrieved successfully",
    data: selectOptions,
  });
});

// @desc    Get single department
// @route   GET /api/department/:id
// @access  Public
export const getDepartment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      teachers: {
        select: {
          id: true,
          name: true,
          qualification: true,
          specialization: true,
        },
      },
      courses: {
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      },
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  if (!department) {
    throw new NotFoundError("Department not found");
  }

  res.status(200).json({
    success: true,
    message: "Department retrieved successfully",
    data: department,
  });
});

// @desc    Create new department
// @route   POST /api/department
// @access  Private (Admin)
export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw parseValidationErrors(errors);
  }

  const { name, description } = req.body;

  // Using transaction to ensure data consistency
  const department = await prisma.$transaction(async (tx) => {
    // Check if department with same name exists
    const existingDepartment = await tx.department.findUnique({
      where: { name },
    });

    if (existingDepartment) {
      throw new ValidationError({
        name: ["Department with this name already exists"],
      });
    }

    return await tx.department.create({
      data: {
        name,
        description,
      },
    });
  });

  res.status(201).json({
    success: true,
    message: "Department created successfully",
    data: department,
  });
});

// @desc    Update department
// @route   PUT /api/department/:id
// @access  Private (Admin)
export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw parseValidationErrors(errors);
  }

  const { id } = req.params;
  const { name, description } = req.body;

  // Using transaction to ensure data consistency
  const department = await prisma.$transaction(async (tx) => {
    const department = await tx.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundError("Department not found");
    }

    // If name is being updated, check for uniqueness
    if (name && name !== department.name) {
      const existingDepartment = await tx.department.findUnique({
        where: { name },
      });

      if (existingDepartment) {
        throw new ValidationError({
          name: ["Department with this name already exists"],
        });
      }
    }

    return await tx.department.update({
      where: { id },
      data: {
        name,
        description,
      },
    });
  });

  res.status(200).json({
    success: true,
    message: "Department updated successfully",
    data: department,
  });
});

// @desc    Delete department
// @route   DELETE /api/department/:id
// @access  Private (Admin)
export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Using transaction to ensure data consistency
  await prisma.$transaction(async (tx) => {
    const department = await tx.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            teachers: true,
            students: true,
            courses: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundError("Department not found");
    }

    // Check if department has any associated records
    if (
      department._count.teachers > 0 ||
      department._count.students > 0 ||
      department._count.courses > 0
    ) {
      throw new ValidationError({
        department: ["Cannot delete department with associated teachers, students, or courses"],
      });
    }

    await tx.department.delete({
      where: { id },
    });
  });

  res.status(200).json({
    success: true,
    message: "Department deleted successfully",
    data: null,
  });
});
