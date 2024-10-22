import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const alphabetOnlyRegex = /^[A-Za-z]+$/;

const passwordSchema = z
  .string()
  .min(8)
  .max(32)
  .regex(passwordRegex, {
    message:
      "Password must contain atleast one lowercase, one uppercase and one special character",
  });
const emailSchema = z.string().email({ message: "Invalid email address" });
const alphabetSchema = (type: string) =>
  z
    .string()
    .regex(alphabetOnlyRegex, {
      message: `${type} must contain only alphabets`,
    });

export const LoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const SignupSchema = z.object({
    firstName: z
      .string({ message: "Invalid first name" })
      .min(2, { message: "First name should atleast have two characters" })
      .max(32, { message: "First name should not exceed 32 characters" })
      .pipe(alphabetSchema("First name")),
    lastName: z
      .string({ message: "Invalid last name" })
      .min(1, { message: "Last name should atleast have one character" })
      .max(32, { message: "Last name should not exceed 32 characters" })
      .pipe(alphabetSchema("Last name")),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Password did not match",
  });
