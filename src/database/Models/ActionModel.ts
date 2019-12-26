import * as mongoose from 'mongoose'

export const ActionModel = new mongoose.Schema({
    session: String,
    address: String,
    addressInfo: Object,
    analytics: Object,
    trash: Array<object>(),
    tickets: Array<object>(),
    browser: Object,
    os: Object,
    date: Date,
    source: String,
    status: String,
    event: Object,
    utm: Object,
    buyer: Object,
    payment: String,
    url: String,
    access: String,
    proccessed: Boolean,
    isSheet: Boolean
})