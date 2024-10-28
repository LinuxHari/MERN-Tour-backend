import { z } from "zod"
import { LocationSchema } from "./adminValidators"
import { EmailSchema, NameSchema } from "./authValidators"
import removeSpaces from "../utils/removeSpaces"

export const UserSchema = z.object({
  phone: z.number().min(4).max(11),
  profile:  
    z.object({
      file: z
        .custom<File>()
        .refine((file) => file.size <= 1 * 1024 * 1024, {
          message: "The profile image must be a maximum of 1MB.",
        })
        .refine((file) => file.type.startsWith("image"), {
          message: "Only images are allowed to be sent.",
        }),
    }),
  address: z.string({message: "Invalid address"}).transform(removeSpaces).pipe(z.string().min(10).max(200))
}).extend(NameSchema.shape).extend(LocationSchema.shape).extend(EmailSchema.shape)

export type UserSchemaType = z.infer<typeof UserSchema>