export const modelOptions = {
    toJSON: {
        virtuals: true,
        transform: (_: any, obj: Record<string, any>) => {
            delete obj._id
            delete obj.id
            delete obj.__v
            return obj
        }
    },
    toObject: {
        virtuals: true,
        transform: (_: any, obj: Record<string, any>) => {
            delete obj._id
            return obj
        }
    },
    versionKey: false,
    timestamps: true 
}