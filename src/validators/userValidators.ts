import { z } from "zod";
import { LocationSchema } from "./adminValidators";
import { EmailSchema, NameSchema } from "./authValidators";
import removeSpaces from "../utils/removeSpaces";
import { BOOKING_STATUS } from "../config/userConfig";
import { PageSchema } from "./tourValidators";

export const TokenSchema = z.object({
  authToken: z.string()
});

export const UserSchema = z
  .object({
    phone: z.number().min(4).max(11),
    profile: z.object({
      file: z
        .custom<File>()
        .refine((file) => file.size <= 1 * 1024 * 1024, {
          message: "The profile image must be a maximum of 1MB."
        })
        .refine((file) => file.type.startsWith("image"), {
          message: "Only images are allowed to be sent."
        })
    }),
    address: z
      .string({ message: "Invalid address" })
      .transform(removeSpaces)
      .pipe(z.string().min(10).max(200))
  })
  .extend(NameSchema.shape)
  .extend(LocationSchema.shape)
  .extend(EmailSchema.shape);

export const BookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUS)
});

export const UserBookings = BookingStatusSchema.merge(PageSchema);

export type UserSchemaType = z.infer<typeof UserSchema>;
export type BookingStatusSchemaType = z.infer<typeof BookingStatusSchema>;
