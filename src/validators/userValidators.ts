import { z } from "zod";
import { LimitSchema, LocationSchema, PageSchema } from "./adminValidators";
import { EmailSchema, LoginSchema, NameSchema } from "./authValidators";
import removeSpaces from "../utils/removeSpaces";
import { BOOKING_STATUS } from "../config/userConfig";
import { BookingTourParamSchema } from "./tourValidators";

export const TokenSchema = z.object({
  accessToken: z.string()
});

export const UserSchema = z
  .object({
    phone: z.number().min(1111).max(99999999999),
    // profile: z.object({
    //   file: z
    //     .custom<File>()
    //     .refine((file) => file.size <= 1 * 1024 * 1024, {
    //       message: "The profile image must be a maximum of 1MB."
    //     })
    //     .refine((file) => file.type.startsWith("image"), {
    //       message: "Only images are allowed to be sent."
    //     })
    // }),
    countryCode: z.number().min(1).max(999),
    address: z.string({ message: "Invalid address" }).transform(removeSpaces).pipe(z.string().min(10).max(200))
  })
  .extend(NameSchema.shape)
  .extend(LocationSchema.shape)
  .extend(EmailSchema.shape);

export const BookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUS)
});

const BasePasswordSchema = z.object({
  newPassword: LoginSchema.shape.password,
  confirmPassword: LoginSchema.shape.password
});

export const PasswordSchema = z
  .object({
    oldPassword: LoginSchema.shape.password
  })
  .merge(BasePasswordSchema)
  .refine(({ newPassword, confirmPassword }) => newPassword === confirmPassword, {
    message: "Password did not match"
  });

export const ResetPasswordSchema = TokenSchema.merge(BasePasswordSchema).refine(
  ({ newPassword, confirmPassword }) => newPassword === confirmPassword,
  {
    message: "Password did not match"
  }
);

export const UserBookings = BookingStatusSchema.merge(PageSchema)
  .merge(
    z.object({
      bookingId: BookingTourParamSchema.shape.bookingId.optional()
    })
  )
  .merge(LimitSchema);

export const FavoriteTours = PageSchema.merge(LimitSchema);

export type UserSchemaType = z.infer<typeof UserSchema>;
export type BookingStatusSchemaType = z.infer<typeof BookingStatusSchema>;
export type PasswordSchemaType = z.infer<typeof PasswordSchema>;
export type UserBookingsType = z.infer<typeof UserBookings>;
