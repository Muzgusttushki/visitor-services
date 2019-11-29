import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {OperationObject} from '../../transferDataObject/buyers/OperationObject';
import {Model} from 'mongoose';
import {AcceptFiltersDataObject} from './dataTransfers/AcceptFiltersDataObject';
import {OperationDetailsDataObject} from './dataTransfers/operationDetailsDataObject';
import {ObjectID} from 'bson';
import {SheetSchemaDTO} from "./schemas/SheetSchemaDTO";

@Injectable()
export class OperationsService {
    constructor(
        @InjectModel('buyers')
        private readonly operationSchema: Model<OperationObject>,
        @InjectModel('sheets')
        private readonly sheetSchema: Model<SheetSchemaDTO>
    ) {
    }

    async operations(filters: AcceptFiltersDataObject,
                     insulation: object): Promise<object> {

        const filterInstance = {};

        if (filters.browsers.length)
            filterInstance['browser.name'] = {$in: filters.browsers}

        if (filters.cities.length)
            filterInstance['addressInfo.city'] = {$in: filters.cities}

        if (filters.events.length)
            filterInstance['event.name'] = {$in: filters.events}

        if (filters.oses.length)
            filterInstance['os.name'] = {$in: filters.oses}

        if (filters.sources.length)
            filterInstance['source'] = {$in: filters.sources}

        if (filters.statuses.length)
            filterInstance['status'] = {$in: filters.statuses}

        const request = this.operationSchema.aggregate();
        request.allowDiskUse(true)
        request.match({
            ...insulation,
            ...filterInstance
        });

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

        if (filters.checked) {
            request.lookup({
                from: 'sheets',
                pipeline: [
                    {
                        $match:
                            {
                                $expr:
                                    {
                                        $and: [
                                            {$in: ['$source', insulation['source']['$in']]},
                                            {$gte: ['$date', insulation['date']['$gte']]},
                                            {$lte: ['$date', insulation['date']['$lte']]},
                                        ]
                                    }
                            }
                    },
                    {
                        $addFields: {
                            visit: true,
                            event: "$$CURRENT.sourceDetails",
                            os: '$$CURRENT.os.name',
                            browser: '$$CURRENT.browser.name',
                            offset: '$$CURRENT._id'
                        }
                    }
                ],
                as: 'sheets'
            });
        }

        request.project({
            samples: {$cond: [filters.checked, {$concatArrays: ['$sheets', '$operations']}, '$operations']}
        });

        request.unwind('samples');
        request.sort({'samples.date': -1});

        request.group({
            _id: null,
            operations: {$push: '$$CURRENT.samples'}
        });

        request.project({
            _id: false,
            length: {$size: '$operations'},
            operations: {
                $slice: ['$operations', filters.offset * 10, 10]
            }
        })

        return await request.exec().then(resolve => {
            return resolve.shift()
        }).catch(console.error)
    }

    async filters(insulation: object): Promise<object> {
        const request = this.operationSchema.aggregate()
            .match({...insulation})
            .group({_id: null, length: {$sum: 1}})
            .lookup({
                from: 'buyers',
                pipeline: [
                    {
                        $match:
                            {
                                $expr:
                                    {
                                        $and: [
                                            {$in: ['$source', insulation['source']['$in']]},
                                            {$gte: ['$date', insulation['date']['$gte']]},
                                            {$lte: ['$date', insulation['date']['$lte']]},
                                        ]
                                    }
                            }
                    },

                    {
                        $group: {
                            _id: '$status',
                            quantity: {$sum: 1}
                        }
                    },

                    {$sort: {quantity: -1}},

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
                                            {$ne: ['$event.name', null]},
                                            {$in: ['$source', insulation['source']['$in']]},
                                            {$gte: ['$date', insulation['date']['$gte']]},
                                            {$lte: ['$date', insulation['date']['$lte']]},
                                        ]
                                    }
                            }
                    },

                    {
                        $group: {
                            _id: '$event.name',
                            quantity: {$sum: 1}
                        }
                    },

                    {$sort: {quantity: -1}},

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
                                            {$ne: ['$addressInfo.city', null]},
                                            {$in: ['$source', insulation['source']['$in']]},
                                            {$gte: ['$date', insulation['date']['$gte']]},
                                            {$lte: ['$date', insulation['date']['$lte']]},
                                        ]
                                    }
                            }
                    },

                    {
                        $group: {
                            _id: '$addressInfo.city',
                            quantity: {$sum: 1}
                        }
                    },

                    {$sort: {quantity: -1}},

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
                                            {$ne: ['$os.name', null]},
                                            {$in: ['$source', insulation['source']['$in']]},
                                            {$gte: ['$date', insulation['date']['$gte']]},
                                            {$lte: ['$date', insulation['date']['$lte']]},
                                        ]
                                    }
                            }
                    },

                    {
                        $group: {
                            _id: '$os.name',
                            quantity: {$sum: 1}
                        }
                    },

                    {$sort: {quantity: -1}},

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
                                            {$ne: ['$browser.name', null]},
                                            {$in: ['$source', insulation['source']['$in']]},
                                            {$gte: ['$date', insulation['date']['$gte']]},
                                            {$lte: ['$date', insulation['date']['$lte']]},
                                        ]
                                    }
                            }
                    },

                    {
                        $group: {
                            _id: '$browser.name',
                            quantity: {$sum: 1}
                        }
                    },

                    {$sort: {quantity: -1}},

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
                                            {$in: ['$source', insulation['source']['$in']]},
                                            {$gte: ['$date', insulation['date']['$gte']]},
                                            {$lte: ['$date', insulation['date']['$lte']]},
                                        ]
                                    }
                            }
                    },

                    {
                        $group: {
                            _id: '$source',
                            quantity: {$sum: 1}
                        }
                    },

                    {$sort: {quantity: -1}},

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
            //console.log(resolve);
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
            date: {$last: '$date'},
            dateEvent: {$last: '$event.date'},
            nameEvent: {$last: '$event.name'},
            utm: {$last: '$utm'},

            country: {$last: '$addressInfo.country'},
            city: {$last: '$addressInfo.city'},
            region: {$last: '$addressInfo.region'},
            zip: {$last: '$addressInfo.zip'},
            timezone: {$last: '$addressInfo.timezone'},

            browser: {$last: '$browser'},
            os: {$last: '$os'},
            cookies: {$last: '$analytics'},
            source: {$last: '$source'},
            url: {$last: '$url'}
        });

        return await request.exec().then(resolve => {
            return resolve.shift()
        })
    }

    async sheetDetails(stage: OperationDetailsDataObject, insulation: object): Promise<object> {
        return await this.sheetSchema
            .findOne({_id: new ObjectID(stage.offset), source: insulation['source']})
            .exec()
            .then(resolve => {
                if(!resolve) throw Error('404');

                return {
                    error: null,
                    then: {
                        _id: stage.offset,
                        date: resolve['date'].toISOString(),
                        utm: resolve['utm'] || {source: null, tags: {}},
                        browser: resolve['browser'] || {},
                        os: resolve['os'] || {},
                        cookies: resolve['analytics'] || {},
                        source: resolve['source'],
                        url: resolve['sourceDetails'],
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
