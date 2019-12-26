import { Document } from "mongoose";

export interface IActionSchema extends Document {
    session: string,
    address: string,
    addressInfo: object,
    analytics: object,
    trash: object[],
    tickets: object[],
    browser: object,
    os: object,
    date: Date,
    source: string,
    status: string,
    event: object,
    utm: object,
    buyer: object,
    payment: string,
    url: string,
    access: string,
    proccessed: boolean,
    isSheet: boolean
}