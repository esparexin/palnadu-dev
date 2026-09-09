import { z } from 'zod';
export declare const projectStageValues: readonly ["JUST_AN_IDEA", "EXISTING_BUSINESS", "EXISTING_PRODUCT", "EXISTING_WEBSITE", "MANUAL_PROCESS", "NEED_TECHNICAL_HELP", "OTHER"];
export declare const requiredHelpValues: readonly ["IDEA_VALIDATION", "WEB_APPLICATION", "MOBILE_APPLICATION", "CUSTOM_SOFTWARE", "AUTOMATION", "TECHNICAL_CONSULTING", "MVP_DEVELOPMENT", "NOT_SURE"];
export declare const leadStatusValues: readonly ["NEW", "CONTACTED", "DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "NOT_QUALIFIED", "ON_HOLD"];
export declare const phoneRegex: RegExp;
export declare const createLeadSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>, z.ZodLiteral<"">]>;
    company: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    problemDescription: z.ZodString;
    currentSituation: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    projectStage: z.ZodDefault<z.ZodEnum<["JUST_AN_IDEA", "EXISTING_BUSINESS", "EXISTING_PRODUCT", "EXISTING_WEBSITE", "MANUAL_PROCESS", "NEED_TECHNICAL_HELP", "OTHER"]>>;
    requiredHelp: z.ZodDefault<z.ZodEnum<["IDEA_VALIDATION", "WEB_APPLICATION", "MOBILE_APPLICATION", "CUSTOM_SOFTWARE", "AUTOMATION", "TECHNICAL_CONSULTING", "MVP_DEVELOPMENT", "NOT_SURE"]>>;
    budget: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    additionalInfo: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    problemDescription: string;
    projectStage: "JUST_AN_IDEA" | "EXISTING_BUSINESS" | "EXISTING_PRODUCT" | "EXISTING_WEBSITE" | "MANUAL_PROCESS" | "NEED_TECHNICAL_HELP" | "OTHER";
    requiredHelp: "IDEA_VALIDATION" | "WEB_APPLICATION" | "MOBILE_APPLICATION" | "CUSTOM_SOFTWARE" | "AUTOMATION" | "TECHNICAL_CONSULTING" | "MVP_DEVELOPMENT" | "NOT_SURE";
    phone?: string | undefined;
    company?: string | undefined;
    currentSituation?: string | undefined;
    budget?: string | undefined;
    additionalInfo?: string | undefined;
}, {
    email: string;
    name: string;
    problemDescription: string;
    phone?: string | undefined;
    company?: string | undefined;
    currentSituation?: string | undefined;
    projectStage?: "JUST_AN_IDEA" | "EXISTING_BUSINESS" | "EXISTING_PRODUCT" | "EXISTING_WEBSITE" | "MANUAL_PROCESS" | "NEED_TECHNICAL_HELP" | "OTHER" | undefined;
    requiredHelp?: "IDEA_VALIDATION" | "WEB_APPLICATION" | "MOBILE_APPLICATION" | "CUSTOM_SOFTWARE" | "AUTOMATION" | "TECHNICAL_CONSULTING" | "MVP_DEVELOPMENT" | "NOT_SURE" | undefined;
    budget?: string | undefined;
    additionalInfo?: string | undefined;
}>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export declare const updateLeadSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["NEW", "CONTACTED", "DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "NOT_QUALIFIED", "ON_HOLD"]>>;
    assignedTo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "NEW" | "CONTACTED" | "DISCOVERY" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST" | "NOT_QUALIFIED" | "ON_HOLD" | undefined;
    assignedTo?: string | null | undefined;
    notes?: string | undefined;
}, {
    status?: "NEW" | "CONTACTED" | "DISCOVERY" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST" | "NOT_QUALIFIED" | "ON_HOLD" | undefined;
    assignedTo?: string | null | undefined;
    notes?: string | undefined;
}>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare const userRoleValues: readonly ["SUPER_ADMIN", "ADMIN", "EDITOR", "PROJECT_MANAGER", "DEVELOPER"];
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodEnum<["SUPER_ADMIN", "ADMIN", "EDITOR", "PROJECT_MANAGER", "DEVELOPER"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
    role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "PROJECT_MANAGER" | "DEVELOPER";
}, {
    email: string;
    password: string;
    name: string;
    role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "PROJECT_MANAGER" | "DEVELOPER";
}>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export declare const publishStatusValues: readonly ["DRAFT", "PUBLISHED", "ARCHIVED"];
export declare const createServiceSchema: z.ZodObject<{
    title: z.ZodString;
    slug: z.ZodString;
    shortDescription: z.ZodString;
    content: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    heroImage: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    seoTitle: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    seoDescription: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    canonicalUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    faqs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        question: z.ZodString;
        answer: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        question: string;
        answer: string;
    }, {
        question: string;
        answer: string;
    }>, "many">>;
    status: z.ZodDefault<z.ZodEnum<["DRAFT", "PUBLISHED", "ARCHIVED"]>>;
    order: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    title: string;
    slug: string;
    shortDescription: string;
    content: string;
    order: number;
    icon?: string | undefined;
    heroImage?: string | undefined;
    seoTitle?: string | undefined;
    seoDescription?: string | undefined;
    canonicalUrl?: string | undefined;
    faqs?: {
        question: string;
        answer: string;
    }[] | undefined;
}, {
    title: string;
    slug: string;
    shortDescription: string;
    content: string;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined;
    icon?: string | undefined;
    heroImage?: string | undefined;
    seoTitle?: string | undefined;
    seoDescription?: string | undefined;
    canonicalUrl?: string | undefined;
    faqs?: {
        question: string;
        answer: string;
    }[] | undefined;
    order?: number | undefined;
}>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export declare const createCaseStudySchema: z.ZodObject<{
    title: z.ZodString;
    slug: z.ZodString;
    clientId: z.ZodOptional<z.ZodString>;
    problem: z.ZodString;
    solution: z.ZodString;
    technology: z.ZodArray<z.ZodString, "many">;
    result: z.ZodString;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    content: z.ZodOptional<z.ZodString>;
    seoTitle: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    seoDescription: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    status: z.ZodDefault<z.ZodEnum<["DRAFT", "PUBLISHED", "ARCHIVED"]>>;
}, "strip", z.ZodTypeAny, {
    result: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    title: string;
    slug: string;
    problem: string;
    solution: string;
    technology: string[];
    content?: string | undefined;
    seoTitle?: string | undefined;
    seoDescription?: string | undefined;
    clientId?: string | undefined;
    images?: string[] | undefined;
}, {
    result: string;
    title: string;
    slug: string;
    problem: string;
    solution: string;
    technology: string[];
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined;
    content?: string | undefined;
    seoTitle?: string | undefined;
    seoDescription?: string | undefined;
    clientId?: string | undefined;
    images?: string[] | undefined;
}>;
export type CreateCaseStudyInput = z.infer<typeof createCaseStudySchema>;
export declare const createBlogPostSchema: z.ZodObject<{
    title: z.ZodString;
    slug: z.ZodString;
    excerpt: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    content: z.ZodString;
    coverImage: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    categoryId: z.ZodOptional<z.ZodString>;
    seoTitle: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    seoDescription: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    canonicalUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    ogImage: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    publishDate: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["DRAFT", "PUBLISHED", "ARCHIVED"]>>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    title: string;
    slug: string;
    content: string;
    seoTitle?: string | undefined;
    seoDescription?: string | undefined;
    canonicalUrl?: string | undefined;
    excerpt?: string | undefined;
    coverImage?: string | undefined;
    categoryId?: string | undefined;
    ogImage?: string | undefined;
    publishDate?: string | undefined;
}, {
    title: string;
    slug: string;
    content: string;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined;
    seoTitle?: string | undefined;
    seoDescription?: string | undefined;
    canonicalUrl?: string | undefined;
    excerpt?: string | undefined;
    coverImage?: string | undefined;
    categoryId?: string | undefined;
    ogImage?: string | undefined;
    publishDate?: string | undefined;
}>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export declare const createBlogCategorySchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    description?: string | undefined;
}, {
    name: string;
    slug: string;
    description?: string | undefined;
}>;
export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;
export declare const createClientSchema: z.ZodObject<{
    name: z.ZodString;
    company: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    email: z.ZodString;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    address: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    notes: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    leadId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    phone?: string | undefined;
    company?: string | undefined;
    notes?: string | undefined;
    address?: string | undefined;
    leadId?: string | undefined;
}, {
    email: string;
    name: string;
    phone?: string | undefined;
    company?: string | undefined;
    notes?: string | undefined;
    address?: string | undefined;
    leadId?: string | undefined;
}>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export declare const projectStatusValues: readonly ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];
export declare const createProjectSchema: z.ZodObject<{
    name: z.ZodString;
    clientId: z.ZodString;
    description: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    status: z.ZodDefault<z.ZodEnum<["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]>>;
    startDate: z.ZodOptional<z.ZodString>;
    expectedCompletion: z.ZodOptional<z.ZodString>;
    technology: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    budget: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    notes: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    status: "ON_HOLD" | "PLANNING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
    clientId: string;
    budget?: string | undefined;
    notes?: string | undefined;
    technology?: string[] | undefined;
    description?: string | undefined;
    startDate?: string | undefined;
    expectedCompletion?: string | undefined;
}, {
    name: string;
    clientId: string;
    status?: "ON_HOLD" | "PLANNING" | "ACTIVE" | "COMPLETED" | "CANCELLED" | undefined;
    budget?: string | undefined;
    notes?: string | undefined;
    technology?: string[] | undefined;
    description?: string | undefined;
    startDate?: string | undefined;
    expectedCompletion?: string | undefined;
}>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export declare const updateMediaSchema: z.ZodObject<{
    alt: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    alt?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    alt?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
export { z };
