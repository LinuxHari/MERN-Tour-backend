import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const alphabetOnlyRegex = /^[A-Za-z]+$/;

const alphabetSchema = (type: string) =>
  z
    .string()
    .regex(alphabetOnlyRegex, {
      message: `${type} must contain only alphabets`,
    });

export const EmailSchema = z.object({email: z.string().email({ message: "Invalid email address" })})
export const NameSchema = z.object({
  firstName: z
      .string()
      .min(2, { message: "First name should atleast have two characters" })
      .max(32, { message: "First name should not exceed 32 characters" })
      .pipe(alphabetSchema("First name")),
    lastName: z
      .string()
      .min(1, { message: "Last name should atleast have one character" })
      .max(32, { message: "Last name should not exceed 32 characters" })
      .pipe(alphabetSchema("Last name"))
})

export const LoginSchema = z.object({
    password: z
    .string()
    .min(8)
    .max(32)
    .regex(passwordRegex, {
      message:
        "Password must contain atleast one lowercase, one uppercase and one special character",
    })
}).extend(EmailSchema.shape);

export const SignupSchema = z.object({
    confirmPassword: LoginSchema.shape.password,
  }).extend(LoginSchema.shape).extend(NameSchema.shape)
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Password did not match",
  });  

export type SignupSchemaType = z.infer<typeof SignupSchema>
export type LoginSchemaType = z.infer<typeof LoginSchema>