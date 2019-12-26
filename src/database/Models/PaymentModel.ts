import * as mongoose from 'mongoose';
import { ObjectID } from 'bson';

export const PaymentModel = new mongoose.Schema({
    tickets: Number,
    contracts: Array<ObjectID>(),
    names: Array<{
        email: String,
        date: Date,
        gender: 1,
        id: ObjectID,
    }>(),
    email: String,
    phone: String,
    gender: Number,
    firstTransactionTime: Date,
    lastTransactionTime: Date,
    city: String,
    event: String,

    ya: Array<String>(),
    ga: Array<String>(),
    fb: Array<String>(),
    vs: Array<String>(),

    transactions: Array<{
        id: ObjectID,
        event: String,
        earnings: Number,
        ticketsInTransaction: Number,
        transactionDate: Date,
        source: String,
        city: String,
        zip: String,
    }>(),

    earnings: Number,
    wasUsed: Boolean,
    access: String,
});