import mongoose, { InferSchemaType } from "mongoose";
import bcrypt from "bcrypt";
import { ROLE } from "../config/userConfig";
import { modelOptions } from "../config/modelConfig";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    countryCode: {
      type: Number
    },
    phone: {
      type: Number
    },
    role: {
      type: String,
      enum: ROLE,
      required: true
    },
    country: {
      type: String
    },
    state: {
      type: String
    },
    city: {
      type: String
    },
    address: {
      type: String
    },
    favorites: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Tours"
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  modelOptions
);

userSchema.method("hashPassword", async function (password: string) {
  const saltCount = 10;
  const hash = await bcrypt.hash(password, saltCount);
  this.password = hash;
});

userSchema.method("validatePassword", async function (oldPassword: string): Promise<boolean> {
  return bcrypt.compare(oldPassword, this.password);
});

export type UserModel = InferSchemaType<typeof userSchema>;

type Methods = {
  hashPassword: (password: string) => Promise<void>;
  validatePassword: (oldPassword: string) => Promise<boolean>;
};

const User = mongoose.model<UserModel & Methods>("Users", userSchema);

export default User;
