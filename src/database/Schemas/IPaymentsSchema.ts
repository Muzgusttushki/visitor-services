import { ObjectID } from "bson";
import { Document } from "mongoose";

export interface IPaymentSchema extends Document {
    // _id: ObjectID;
    tickets: Number;
    contracts: ObjectID[];
    names: {
        email: String;
        date: Date;
        gender: 1;
        id: ObjectID;
    }[];
    email: String;
    phone: String;
    gender: Number;
    firstTransactionTime: Date;
    lastTransactionTime: Date,
    city: String;
    event: String;

    ya: String[];
    ga: String[];
    fb: String[];
    vs: String[];

    transactions: {
        id: ObjectID;
        event: String;
        earnings: Number;
        ticketsInTransaction: Number;
        transactionDate: Date;
        source: String;
        city: String;
        zip: String;
    }[];

    earnings: Number;
    wasUsed: Boolean;
    access: String;
}