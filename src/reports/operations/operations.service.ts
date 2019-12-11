import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OperationObject } from '../../transferDataObject/buyers/OperationObject';
import { Model } from 'mongoose';
import { OperationDetailsDataObject } from './dataTransfers/operationDetailsDataObject';
import { ObjectID } from 'bson';
import { SheetSchemaDTO } from "./schemas/SheetSchemaDTO";
import { ActionsFilterDTO } from './DTO/ActionsFilterDTO';

@Injectable()
export class OperationsService {
    constructor(
        @InjectModel('buyers')
        private readonly operationSchema: Model<OperationObject>,
        @InjectModel('sheets')
        private readonly sheetSchema: Model<SheetSchemaDTO>
    ) {
    }

    async get(stage: ActionsFilterDTO, insulation: object): Promise<object> {
        const filters = { $and: [{}], ...insulation },
            projection = {
                "_id": true,
                "status": true,
                "os.name": true,
                "event.name": true,
                "addressInfo.city": true,
                "browser.name": true,
                "source": true,
                "isSheet": true,
                "date": true,
                "address": true,
                "addressInfo.zip": true,
                "url": true
            };

        filters.$and.push({ status: { $ne: 'WIDGET_PAYMENT' } });

        if (!stage.sheets) filters["$and"].push({ isSheet: { $ne: true } })
        if (stage.browsers)
            filters["$and"].push({ "browser.name": { $in: stage.browsers } })
        if (stage.oses)
            filters["$and"].push({ "os.name": { $in: stage.oses } })
        if (stage.events)
            filters["$and"].push({ "event.name": { $in: stage.events } })
        if (stage.cities)
            filters["$and"].push({ "addressInfo.city": { $in: stage.cities } })
        if (stage.statuses)
            filters["$and"].push({ "status": { $in: stage.statuses } })

        if (!filters["$and"].length)
            delete filters["$and"];

        const length = await this.operationSchema
            .countDocuments(filters)
            .exec();

        if (length === 0)
            return { length: 0, documents: [] };

        const documents = await this.operationSchema
            .find(filters, projection)
            .sort({ date: -1 })
            .skip((stage.page || 0) * (stage.views || 20))
            .limit(stage.views || 20)
            .exec()

        return {
            length,
            documents: documents.map(document => {
                return {
                    os: document['os'] ? document['os']['name'] : null,
                    event: document['event'] ? document['event']['name'] : null,
                    browser: document['browser'] ? document['browser']['name'] : null,
                    city: document['addressInfo'] ? document['addressInfo']['city'] : null,
                    zip: document['addressInfo'] ? document['addressInfo']['zip'] : null,
                    address: document['address'],
                    date: document['date'],
                    status: document['status'] || 'VISITED',
                    source: document['source'],
                    isSheet: document['isSheet'],
                    url: document['url'],
                    _id: document["_id"]
                }
            })
        };
    }


    async filters(insulation: object): Promise<object> {
        const request = this.operationSchema.aggregate()
            .allowDiskUse(true)
            .match(insulation)
            .group({ _id: null, length: { $sum: 1 } })
            .lookup({
                from: 'buyers',
                pipeline: [
                    {
                        $match:
                        {
                            $expr:
                            {
                                $and: [
                                    { $ne: ['$status', 'WIDGET_PAYMENT'] },
                                    { $ne: ['$status', null] },
                                    { $ne: ['$isSheet', true] },
                                    { $in: ['$source', insulation['source']['$in']] },
                                    { $gte: ['$date', insulation['date']['$gte']] },
                                    { $lte: ['$date', insulation['date']['$lte']] },
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: '$status',
                            quantity: { $sum: 1 }
                        }
                    },
                    { $sort: { quantity: -1 } },
                    {
                        $project: {
                            _id: false,
                            name: '$_id',
                            quantity: true
                        }
                    }
                ],
                as: 'statuses'
            })
            .lookup({
                from: 'buyers',
                pipeline: [
                    {
                        $match:
                        {
                            $expr:
                            {
                                $and: [
                                    { $ne: ['$status', 'WIDGET_PAYMENT'] },
                                    { $ne: ['$isSheet', true] },
                                    { $ne: ['$event.name', null] },
                                    { $ne: ['$event.name', ""] },
                                    { $in: ['$source', insulation['source']['$in']] },
                                    { $gte: ['$date', insulation['date']['$gte']] },
                                    { $lte: ['$date', insulation['date']['$lte']] },
                                ]
                            }
                        }
                    },

                    {
                        $group: {
                            _id: '$event.name',
                            quantity: { $sum: 1 }
                        }
                    },

                    { $sort: { quantity: -1 } },

                    {
                        $project: {
                            _id: false,
                            name: '$_id',
                            quantity: true
                        }
                    }
                ],
                as: 'events'
            })
            .lookup({
                from: 'buyers',
                pipeline: [
                    {
                        $match:
                        {
                            $expr:
                            {
                                $and: [
                                    { $ne: ['$status', 'WIDGET_PAYMENT'] },
                                    { $ne: ['$isSheet', true] },
                                    { $ne: ['$addressInfo.city', null] },
                                    { $in: ['$source', insulation['source']['$in']] },
                                    { $gte: ['$date', insulation['date']['$gte']] },
                                    { $lte: ['$date', insulation['date']['$lte']] },
                                ]
                            }
                        }
                    },

                    {
                        $group: {
                            _id: '$addressInfo.city',
                            quantity: { $sum: 1 }
                        }
                    },

                    { $sort: { quantity: -1 } },

                    {
                        $project: {
                            _id: false,
                            name: '$_id',
                            quantity: true
                        }
                    }
                ],
                as: 'cities'
            })
            .lookup({
                from: 'buyers',
                pipeline: [
                    {
                        $match:
                        {
                            $expr:
                            {
                                $and: [
                                    { $ne: ['$status', 'WIDGET_PAYMENT'] },
                                    { $ne: ['$os.name', null] },
                                    { $in: ['$source', insulation['source']['$in']] },
                                    { $gte: ['$date', insulation['date']['$gte']] },
                                    { $lte: ['$date', insulation['date']['$lte']] },
                                ]
                            }
                        }
                    },

                    {
                        $group: {
                            _id: '$os.name',
                            quantity: { $sum: 1 }
                        }
                    },

                    { $sort: { quantity: -1 } },

                    {
                        $project: {
                            _id: false,
                            name: '$_id',
                            quantity: true
                        }
                    }
                ],
                as: 'oses'
            })
            .lookup({
                from: 'buyers',
                pipeline: [
                    {
                        $match:
                        {
                            $expr:
                            {
                                $and: [
                                    { $ne: ['$status', 'WIDGET_PAYMENT'] },
                                    { $ne: ['$browser.name', null] },
                                    { $in: ['$source', insulation['source']['$in']] },
                                    { $gte: ['$date', insulation['date']['$gte']] },
                                    { $lte: ['$date', insulation['date']['$lte']] },
                                ]
                            }
                        }
                    },

                    {
                        $group: {
                            _id: '$browser.name',
                            quantity: { $sum: 1 }
                        }
                    },

                    { $sort: { quantity: -1 } },

                    {
                        $project: {
                            _id: false,
                            name: '$_id',
                            quantity: true
                        }
                    }
                ],
                as: 'browsers'
            })
            .lookup({
                from: 'buyers',
                pipeline: [
                    {
                        $match:
                        {
                            $expr:
                            {
                                $and: [
                                    { $ne: ['$status', 'WIDGET_PAYMENT'] },
                                    { $ne: ['$source', null] },
                                    { $in: ['$source', insulation['source']['$in']] },
                                    { $gte: ['$date', insulation['date']['$gte']] },
                                    { $lte: ['$date', insulation['date']['$lte']] },
                                ]
                            }
                        }
                    },

                    {
                        $group: {
                            _id: '$source',
                            quantity: { $sum: 1 }
                        }
                    },

                    { $sort: { quantity: -1 } },

                    {
                        $project: {
                            _id: false,
                            name: '$_id',
                            quantity: true
                        }
                    }
                ],
                as: 'sources'
            })

        request.project({
            _id: false,
            events: true,
            cities: true,
            oses: true,
            browsers: true,
            statuses: true,
            sources: true
        })

        return await request.exec().then(resolve => {
            return resolve.shift();
        }).catch(err => {
            console.log(err)
        })
    }


    async details(stage: OperationDetailsDataObject, insulation: object): Promise<object> {
        const request = this.operationSchema.aggregate();
        request.match({
            _id: new ObjectID(stage.offset),
            source: insulation['source']
        });

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
            source: { $last: '$source' },
            url: { $last: '$url' }
        });

        return await request.exec().then(resolve => {
            return resolve.shift()
        })
    }

    async sheetDetails(stage: OperationDetailsDataObject, insulation: object): Promise<object> {
        return await this.operationSchema
            .findOne({ _id: new ObjectID(stage.offset), source: insulation['source'] })
            .exec()
            .then(resolve => {
                if (!resolve) throw Error('404');

                return {
                    error: null,
                    then: {
                        _id: stage.offset,
                        date: resolve['date'].toISOString(),
                        utm: resolve['utm'] || { source: null, tags: {} },
                        browser: resolve['browser'] || {},
                        os: resolve['os'] || {},
                        cookies: resolve['analytics'] || {},
                        source: resolve['source'],
                        url: resolve['url'],
                        address: resolve['address']
                    }
                }
            })
            .catch(resolve => {
                console.error(resolve);
                return {
                    error: {
                        message: resolve
                    },
                    then: {}
                }
            })
    }
}
