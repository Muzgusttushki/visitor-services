import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OperationObject } from '../../transferDataObject/buyers/OperationObject';
import { Model } from 'mongoose';
import { AcceptFiltersDataObject } from './dataTransfers/AcceptFiltersDataObject';
import { OperationDetailsDataObject } from './dataTransfers/operationDetailsDataObject';
import { ObjectID } from 'bson';

@Injectable()
export class OperationsService {
    constructor(
        @InjectModel('buyers')
        private readonly operationSchema: Model<OperationObject>,
    ) { }

    async operations(filters: AcceptFiltersDataObject,
        insulation: object): Promise<object> {

        const filterInstance = {};

        if (filters.browsers.length)
            filterInstance['browser.name'] = { $in: filters.browsers }

        if (filters.cities.length)
            filterInstance['addressInfo.city'] = { $in: filters.cities }

        if (filters.events.length)
            filterInstance['event.name'] = { $in: filters.events }

        if (filters.oses.length)
            filterInstance['os.name'] = { $in: filters.oses }

        if (filters.sources.length)
            filterInstance['source'] = { $in: filters.sources }

        if (filters.statuses.length)
            filterInstance['status'] = { $in: filters.statuses }

        const request = this.operationSchema.aggregate();
        request.allowDiskUse(true)
        request.match({
            source: insulation['source'],
            ...filterInstance
        })

        request.group({
            _id: null,
            operations: {
                $push:
                {
                    offset: '$$CURRENT._id',
                    date: '$$CURRENT.date',
                    source: '$$CURRENT.source',
                    status: '$$CURRENT.status',
                    city: '$$CURRENT.addressInfo.city',
                    zip: '$$CURRENT.addressInfo.zip',
                    address: '$$CURRENT.address',
                    os: '$$CURRENT.os.name',
                    browser: '$$CURRENT.browser.name',
                    event: '$$CURRENT.event.name'
                },
            }
        });

        request.lookup({
            from: 'sheets',
            pipeline: [
                {
                    $match:
                    {
                        $expr:
                        {
                            $in: ["$source", insulation['source']['$in'] || []]
                        }
                    }
                },

                {
                    $addFields: {
                        visit: true,
                        event: "$$CURRENT.sourceDetails",
                        os: '$$CURRENT.os.name',
                        browser: '$$CURRENT.browser.name'
                    }
                }
            ],
            as: 'sheets'
        })

        request.project({
            samples: { $concatArrays: ['$sheets', '$operations'] }
        })

        request.unwind('samples')
        request.sort({ 'samples.date': -1 })

        request.group({
            _id: null,
            operations: { $push: '$$CURRENT.samples' }
        })

        request.project({
            _id: false,
            length: { $size: '$operations' },
            operations: {
                $slice: ['$operations', filters.offset * 10, 10]
            }
        })

        return await request.exec().then(resolve => {
            return resolve.shift()
        }).catch(console.error)
    }

    async operationDetails(stage: OperationDetailsDataObject, insulation: object): Promise<object> {
        const request = this.operationSchema.aggregate();
        request.match({
            _id: new ObjectID(stage.offset),
            source: insulation['source']
        })

        request.group({
            _id: '$_id',
            date: { $last: '$date' },
            dateEvent: { $last: '$event.date' },
            nameEvent: { $last: '$event.name' },
            utm: { $last: '$utm' },

            country: { $last: '$addressInfo.country' },
            city: { $last: '$addressInfo.city' },
            region: { $last: '$addressInfo.region' },
            zip: { $last: '$addressInfo.zip' },
            timezone: { $last: '$addressInfo.timezone' },

            browser: { $last: '$browser' },
            os: { $last: '$os' },
            cookies: { $last: '$analytics' },
            source: { $last: '$source' }
        })

        return await request.exec().then(resolve => {
            return resolve.shift()
        })
    }

    async filters(insulation: object): Promise<object> {
        const request = this.operationSchema.aggregate();

        request.match({
            ...insulation
        });

        request.group({
            _id: null,

            statuses: { $push: '$status' },
            sources: { $push: '$source' },
            events: { $push: '$event.name' },
            cities: { $push: '$addressInfo.city' },
            browsers: { $push: '$browser.name' },
            oses: { $push: '$os.name' }
        });


        request.project({
            _id: false,

            statuses: {
                $filter: {
                    input: { $setUnion: ['$statuses'] },
                    as: "num",
                    cond: { $ne: ['$$num', null] }
                }
            },

            sources: {
                $filter: {
                    input: { $setUnion: ['$sources'] },
                    as: "num",
                    cond: { $ne: ['$$num', null] }
                }
            },

            events: {
                $filter: {
                    input: { $setUnion: ['$events'] },
                    as: "num",
                    cond: { $ne: ['$$num', null] }
                }
            },

            cities: {
                $filter: {
                    input: { $setUnion: ['$cities'] },
                    as: "num",
                    cond: { $ne: ['$$num', null] }
                }
            },

            browsers: {
                $filter: {
                    input: { $setUnion: ['$browsers'] },
                    as: "num",
                    cond: { $ne: ['$$num', null] }
                }
            },

            oses: {
                $filter: {
                    input: { $setUnion: ['$oses'] },
                    as: "num",
                    cond: { $ne: ['$$num', null] }
                }
            },
        })

        return await request.exec().then(resolve => {
            return resolve.shift();
        })
    }
}
