import * as mongoose from "mongoose";


export interface SheetSchemaDTO extends mongoose.Document {
    _id: mongoose.Types.ObjectId,
    address: string,
    sourceDetails: string,
    source: string,
    os: {
        name: string,
        arch: string
    },
    browser: {
        name: string,
        version: string
    },
    product: string,
    date: Date,
    utm: {
        source: string,
        tags: object
    },
    analytics: {
        google: string,
        facebook: string,
        yandex: string
    }
}
