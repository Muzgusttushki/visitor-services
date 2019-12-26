import { ObjectID } from "bson";

export interface IUser {
    _id: ObjectID,
    sources: String[],
    username: String,
    company_name: String,
    pin: Number,
    role: Number,
    eq: String,
    access: string[]
}