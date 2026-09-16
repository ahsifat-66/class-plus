import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z
    .string()
    .email("Invalid email address format")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  role: z.enum(["TEACHER", "STUDENT"], {
    message: "Role must strictly be either TEACHER or STUDENT",
  }),
  teacherCode: z.string().optional(),
});

export const signInSchema = z.object({
  email: z
    .string()
    .email("Invalid email address format")
    .trim()
    .toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
