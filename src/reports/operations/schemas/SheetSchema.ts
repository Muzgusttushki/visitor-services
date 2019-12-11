import * as mongoose from "mongoose";


const SheetSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    address: String,
    sourceDetails: String,
    source: String,
    os: {
        name: String,
        arch: String
    },
    browser: {
        name: String,
        version: String
    },
    product: String,
    date: Date,
    utm: {
        source: String,
        tags: Object
    },
    analytics: {
        google: String,
        facebook: String,
        yandex: String,
        vis: String,
    },
    isSheet: Boolean
});

export  {SheetSchema}
