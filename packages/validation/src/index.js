"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.z = exports.updateMediaSchema = exports.createProjectSchema = exports.projectStatusValues = exports.createClientSchema = exports.createBlogCategorySchema = exports.createBlogPostSchema = exports.createCaseStudySchema = exports.createServiceSchema = exports.publishStatusValues = exports.createUserSchema = exports.userRoleValues = exports.loginSchema = exports.updateLeadSchema = exports.createLeadSchema = exports.phoneRegex = exports.leadStatusValues = exports.requiredHelpValues = exports.projectStageValues = void 0;
const zod_1 = require("zod");
Object.defineProperty(exports, "z", { enumerable: true, get: function () { return zod_1.z; } });
exports.projectStageValues = [
    'JUST_AN_IDEA',
    'EXISTING_BUSINESS',
    'EXISTING_PRODUCT',
    'EXISTING_WEBSITE',
    'MANUAL_PROCESS',
    'NEED_TECHNICAL_HELP',
    'OTHER',
];
exports.requiredHelpValues = [
    'IDEA_VALIDATION',
    'WEB_APPLICATION',
    'MOBILE_APPLICATION',
    'CUSTOM_SOFTWARE',
    'AUTOMATION',
    'TECHNICAL_CONSULTING',
    'MVP_DEVELOPMENT',
    'NOT_SURE',
];
exports.leadStatusValues = [
    'NEW',
    'CONTACTED',
    'DISCOVERY',
    'PROPOSAL',
    'NEGOTIATION',
    'WON',
    'LOST',
    'NOT_QUALIFIED',
    'ON_HOLD',
];
exports.phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,16}$/;
exports.createLeadSchema = zod_1.z.object({
    name: zod_1.z
        .string({ required_error: 'Please enter your name' })
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters'),
    email: zod_1.z
        .string({ required_error: 'Please enter your email address' })
        .trim()
        .toLowerCase()
        .email('Please enter a valid email address (e.g. name@domain.com)'),
    phone: zod_1.z
        .string()
        .trim()
        .max(25, 'Phone number cannot exceed 25 characters')
        .refine((val) => !val || exports.phoneRegex.test(val), {
        message: 'Please enter a valid phone number',
    })
        .optional()
        .or(zod_1.z.literal('')),
    company: zod_1.z
        .string()
        .trim()
        .max(200, 'Company name cannot exceed 200 characters')
        .optional()
        .or(zod_1.z.literal('')),
    problemDescription: zod_1.z
        .string({ required_error: 'Please describe your idea or problem' })
        .trim()
        .min(10, 'Please share at least 10 characters about what you want to build or solve')
        .max(5000, 'Description cannot exceed 5000 characters'),
    currentSituation: zod_1.z
        .string()
        .trim()
        .max(2000, 'Current situation cannot exceed 2000 characters')
        .optional()
        .or(zod_1.z.literal('')),
    projectStage: zod_1.z.enum(exports.projectStageValues).default('JUST_AN_IDEA'),
    requiredHelp: zod_1.z.enum(exports.requiredHelpValues).default('NOT_SURE'),
    budget: zod_1.z
        .string()
        .trim()
        .max(100, 'Budget description cannot exceed 100 characters')
        .optional()
        .or(zod_1.z.literal('')),
    additionalInfo: zod_1.z
        .string()
        .trim()
        .max(3000, 'Additional information cannot exceed 3000 characters')
        .optional()
        .or(zod_1.z.literal('')),
});
exports.updateLeadSchema = zod_1.z.object({
    status: zod_1.z.enum(exports.leadStatusValues).optional(),
    assignedTo: zod_1.z.string().uuid().optional().nullable(),
    notes: zod_1.z.string().max(5000).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: 'Please enter your email' })
        .trim()
        .toLowerCase()
        .email('Please enter a valid email address'),
    password: zod_1.z
        .string({ required_error: 'Please enter your password' })
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password cannot exceed 128 characters'),
});
exports.userRoleValues = [
    'SUPER_ADMIN',
    'ADMIN',
    'EDITOR',
    'PROJECT_MANAGER',
    'DEVELOPER',
];
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email(),
    password: zod_1.z.string().min(8).max(128),
    name: zod_1.z.string().trim().min(2).max(100),
    role: zod_1.z.enum(exports.userRoleValues),
});
exports.publishStatusValues = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
exports.createServiceSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(2).max(200),
    slug: zod_1.z
        .string()
        .trim()
        .min(2)
        .max(200)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
    shortDescription: zod_1.z.string().trim().min(10).max(500),
    content: zod_1.z.string().trim().min(20),
    icon: zod_1.z.string().max(100).optional(),
    heroImage: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    seoTitle: zod_1.z.string().max(70).optional().or(zod_1.z.literal('')),
    seoDescription: zod_1.z.string().max(160).optional().or(zod_1.z.literal('')),
    canonicalUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    faqs: zod_1.z
        .array(zod_1.z.object({
        question: zod_1.z.string().min(5),
        answer: zod_1.z.string().min(10),
    }))
        .optional(),
    status: zod_1.z.enum(exports.publishStatusValues).default('DRAFT'),
    order: zod_1.z.number().int().min(0).default(0),
});
exports.createCaseStudySchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(2).max(200),
    slug: zod_1.z
        .string()
        .trim()
        .min(2)
        .max(200)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    clientId: zod_1.z.string().uuid().optional(),
    problem: zod_1.z.string().trim().min(20),
    solution: zod_1.z.string().trim().min(20),
    technology: zod_1.z.array(zod_1.z.string()).min(1),
    result: zod_1.z.string().trim().min(20),
    images: zod_1.z.array(zod_1.z.string().url()).optional(),
    content: zod_1.z.string().optional(),
    seoTitle: zod_1.z.string().max(70).optional().or(zod_1.z.literal('')),
    seoDescription: zod_1.z.string().max(160).optional().or(zod_1.z.literal('')),
    status: zod_1.z.enum(exports.publishStatusValues).default('DRAFT'),
});
exports.createBlogPostSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(2).max(300),
    slug: zod_1.z
        .string()
        .trim()
        .min(2)
        .max(300)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    excerpt: zod_1.z.string().trim().max(500).optional().or(zod_1.z.literal('')),
    content: zod_1.z.string().trim().min(50),
    coverImage: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    categoryId: zod_1.z.string().uuid().optional(),
    seoTitle: zod_1.z.string().max(70).optional().or(zod_1.z.literal('')),
    seoDescription: zod_1.z.string().max(160).optional().or(zod_1.z.literal('')),
    canonicalUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    ogImage: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    publishDate: zod_1.z.string().datetime().optional(),
    status: zod_1.z.enum(exports.publishStatusValues).default('DRAFT'),
});
exports.createBlogCategorySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100),
    slug: zod_1.z
        .string()
        .trim()
        .min(2)
        .max(100)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: zod_1.z.string().trim().max(500).optional(),
});
exports.createClientSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100),
    company: zod_1.z.string().trim().max(200).optional().or(zod_1.z.literal('')),
    email: zod_1.z.string().trim().toLowerCase().email(),
    phone: zod_1.z.string().trim().max(25).optional().or(zod_1.z.literal('')),
    address: zod_1.z.string().trim().max(500).optional().or(zod_1.z.literal('')),
    notes: zod_1.z.string().trim().max(3000).optional().or(zod_1.z.literal('')),
    leadId: zod_1.z.string().uuid().optional(),
});
exports.projectStatusValues = [
    'PLANNING',
    'ACTIVE',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED',
];
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(200),
    clientId: zod_1.z.string().uuid(),
    description: zod_1.z.string().trim().max(5000).optional().or(zod_1.z.literal('')),
    status: zod_1.z.enum(exports.projectStatusValues).default('PLANNING'),
    startDate: zod_1.z.string().datetime().optional(),
    expectedCompletion: zod_1.z.string().datetime().optional(),
    technology: zod_1.z.array(zod_1.z.string()).optional(),
    budget: zod_1.z.string().trim().max(100).optional().or(zod_1.z.literal('')),
    notes: zod_1.z.string().trim().max(5000).optional().or(zod_1.z.literal('')),
});
exports.updateMediaSchema = zod_1.z.object({
    alt: zod_1.z.string().trim().max(300).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
//# sourceMappingURL=index.js.map