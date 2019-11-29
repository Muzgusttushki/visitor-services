import * as mongoose from "mongoose";
import { ObjectID, ObjectId } from "bson";
import { IsString, IsDefined, IsUrl, ValidateNested, Min, Max, MinLength, MaxLength, IsNumber } from "class-validator";
import { Type } from "class-transformer";

const SegmentSchema = new mongoose.Schema({
    _id: ObjectID,
    access: Array<ObjectID>(),
    enable: Boolean,
    name: String,
    target: String,
    updates: Boolean,
    last: Date,
    automation: Boolean,
    sources: Array<string>(),
    then: {
        users: {
            segment: Number,
            database: Number
        },
        stats: {
            earnings: Number,
            averageUserEarnings: Number,
            orders: Number,
            averageEarnings: Number
        },
        devices: {
            phone: Number,
            computer: Number
        },
        events: Array<object>(),
        locations: Array<object>(),
        buyers: Array<object>()
    }
})

interface Segments extends mongoose.Document {
    _id: ObjectID;
    access: ObjectID[];
    enable: boolean;
    name: string;
    target: string;
    updates: boolean;
    last: Date;
    automation: boolean;
    sources: string[];
    then: {
        users: {
            segment: number;
            database: number;
        };
        stats: {
            earnings: number;
            averageUserEarnings: number;
            orders: number;
            averageEarnings: number;
        };
        devices: {
            phone: number;
            computer: number;
        };

        events: {
            name: string;
            transactions: number;
            share: number;
        }[];

        locations: {
            name: string;
            count: number;
        }[];

        buyers: {
            phone: string;
            name: string;
            event: string;
            earnings: number;
            tickets: number;
            source: string;
            transactions: number;
            lastActivity: Date;
            firstActivity: Date;
        }[];
    };
}


class SegmentCreate {
    @IsString()
    @MaxLength(40)
    @MinLength(1)
    @IsDefined()
    name: string

    @IsDefined()
    @IsString()
    target: 'buyers->new' |
        'buyers->month' |
        'buyers->quarter' |
        'buyers->half-year' |
        'buyers->weekends' |
        'buyers->friday'


    @IsDefined()
    @IsUrl({}, { each: true })
    sources: string[]
}

class SegmentDetails {
    @IsDefined()
    @IsString()
    @MinLength(5)
    @MaxLength(40)
    segment: ObjectId
}

class SegmentDetailUsers {
    @IsDefined()
    @IsString()
    @MinLength(5)
    @MaxLength(40)
    segment: ObjectId

    @IsDefined()
    @IsNumber()
    offset: number
}

export { Segments, SegmentDetails, SegmentSchema, SegmentCreate, SegmentDetailUsers }
