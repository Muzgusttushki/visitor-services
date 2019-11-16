import { ObjectId } from "bson";

export interface PaymentsUsers {
    ref: ObjectId;
    phone: string;
    name: string;
}