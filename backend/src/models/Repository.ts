import mongoose, { Schema } from "mongoose";

const repositorySchema = new Schema(
  {
    owner: { type: String, required: true },
    name: { type: String, required: true },
    fullName: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    description: { type: String, default: "" },
    isPrivate: { type: Boolean, default: false },
    defaultBranch: { type: String, default: "main" },
    projectId: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Repository = mongoose.model("Repository", repositorySchema);
