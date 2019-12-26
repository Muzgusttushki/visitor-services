import {
    BadRequestException,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { DashboardObject } from '../../transferDataObject/dashboard/dashboardObject';
import { InjectModel } from '@nestjs/mongoose';
import { OperationObject } from '../../transferDataObject/buyers/OperationObject';
import { AccountObject } from '../../transferDataObject/account/AccountObject';
import { Model } from 'mongoose';


@Injectable()
export class DashboardService {
    constructor(
        @InjectModel('buyers')
        private readonly operationsSchema: Model<OperationObject>,
    ) {
      //  this.graphicsSalesNew();
    }

    async getDashboardStats(stage: DashboardObject, session: AccountObject): Promise<object> {
        if (stage.timeInterval.start > stage.timeInterval.end) {
            return new BadRequestException();
        }

        const timeRange = {
            start: new Date(Date.parse(stage.timeInterval.start)),
            end: new Date(Date.parse(stage.timeInterval.end)),
        };

        timeRange.start.setUTCHours(0, 0, 0, 0);
        timeRange.start.setUTCDate(timeRange.start.getUTCDate() + 1)

        timeRange.end.setUTCHours(23, 59, 59, 0);

        const prepareSources = { source: {} };
        /**
         * @description Проверяем, не указали определенный источник в запросе.
         */
        if (stage.sources && stage.sources.length) {
            /**
             * @description В случае, если нарушины права доступа, возвращаем ошибку.
             */
            if (
                session.role < 6 &&
                !stage.sources.every(resolve => session.sources.includes(resolve))
            ) {
                throw new ForbiddenException();
            }

            prepareSources.source = { $in: stage.sources };
        } else {
            prepareSources.source = { $in: session.sources };
        }

        const backToDays =
            Math.ceil(
                Math.abs(timeRange.end.getTime() - timeRange.start.getTime()) /
                (1000 * 3600 * 24),
            ) || 1;

        const previewTimeRange = {
            start: new Date(
                timeRange.start.getUTCFullYear(),
                timeRange.start.getUTCMonth(),
                timeRange.start.getUTCDate() - (backToDays + 1),
            ),
            end: new Date(
                timeRange.start.getUTCFullYear(),
                timeRange.start.getUTCMonth(),
                (timeRange.start.getUTCDate() - 1),
            ),
        };

        previewTimeRange.start.setUTCHours(0, 0, 0, 0);
        previewTimeRange.end.setUTCHours(23, 59, 59, 0);
        previewTimeRange.start.setUTCDate(previewTimeRange.start.getUTCDate() + 1)

        /**
         * Ниже идут агрегации, которые позволяют,
         * производит произвольные расчеты, внтутри mongodb
         */

        /**
         * Общие характиристики компании
         */
        const request = this.operationsSchema
            .aggregate([
                { $match: { ...prepareSources } },
                {
                    $group: {
                        _id: null, allOperations: {
                            $push: {
                                date: '$$CURRENT.date',
                                status: '$$CURRENT.status',
                                tickets: '$$CURRENT.tickets',
                                buyer: {
                                    phone: '$$CURRENT.buyer.phone',
                                    name: '$$CURRENT.buyer.name'
                                },
                                event: { name: '$$CURRENT.event.name' }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        previousSales: {
                            $filter: {
                                input: '$allOperations',
                                as: 'item',
                                cond: {
                                    $and: [
                                        { $lte: ['$$item.date', previewTimeRange.end] },
                                        { $gte: ['$$item.date', previewTimeRange.start] },
                                        { $eq: ['$$item.status', 'WIDGET_PAYMENT'] },
                                    ],
                                },
                            },
                        },
                        sales: {
                            $filter: {
                                input: '$allOperations',
                                as: 'item',
                                cond: {
                                    $and: [
                                        { $lte: ['$$item.date', timeRange.end] },
                                        { $gte: ['$$item.date', timeRange.start] },
                                        { $eq: ['$$item.status', 'WIDGET_PAYMENT'] },
                                    ],
                                },
                            },
                        },
                        operations: {
                            $filter: {
                                input: '$allOperations',
                                as: 'item',
                                cond: {
                                    $and: [
                                        { $lte: ['$$item.date', timeRange.end] },
                                        { $gte: ['$$item.date', timeRange.start] },
                                    ],
                                },
                            },
                        },
                        previousOperations: {
                            $filter: {
                                input: '$allOperations',
                                as: 'item',
                                cond: {
                                    $and: [
                                        { $lte: ['$$item.date', previewTimeRange.end] },
                                        { $gte: ['$$item.date', previewTimeRange.start] },
                                    ],
                                },
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        tickets: {
                            $reduce: {
                                input: '$sales.tickets',
                                initialValue: [],
                                in: { $concatArrays: ['$$value', '$$this'] },
                            },
                        },
                        previousTickets: {
                            $reduce: {
                                input: '$previousSales.tickets',
                                initialValue: [],
                                in: { $concatArrays: ['$$value', '$$this'] },
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        earnings: {
                            $reduce: {
                                input: '$tickets',
                                initialValue: 0,
                                in: {
                                    $add: [
                                        '$$value',
                                        {
                                            $cond: {
                                                if: { $eq: ['$this.quantity', 1] },
                                                then: '$$this.price',
                                                else: {
                                                    $multiply: ['$$this.price', '$$this.quantity'],
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },

                        previousEarnings: {
                            $reduce: {
                                input: '$previousTickets',
                                initialValue: 0,
                                in: {
                                    $add: [
                                        '$$value',
                                        {
                                            $cond: {
                                                if: { $eq: ['$this.quantity', 1] },
                                                then: '$$this.price',
                                                else: {
                                                    $multiply: ['$$this.price', '$$this.quantity'],
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: false,
                        operations: { $size: '$operations' },
                        previousOperations: { $size: '$previousOperations' },
                        sales: { $size: '$sales' },
                        previousSales: { $size: '$previousSales' },
                        events: { $size: { $setUnion: ['$sales.event.name', []] } },
                        previousEvents: { $size: { $setUnion: ['$previousSales.event.name', []] } },
                        earnings: true,
                        previousEarnings: true,
                        buyers: {
                            $size: {
                                $let: {
                                    vars: {
                                        buyers: {
                                            $filter: {
                                                input: '$allOperations',
                                                as: 'item',
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$item.status', 'WIDGET_PAYMENT'] },
                                                    ],
                                                },
                                            }
                                        }
                                    },
                                    in: { $setUnion: ['$$buyers.buyer.phone', []] }
                                }
                            }
                        },
                        previousBuyers: {
                            $size: {
                                $let: {
                                    vars: {
                                        buyers: {
                                            $filter: {
                                                input: '$allOperations',
                                                as: 'item',
                                                cond: {
                                                    $and: [
                                                        { $gte: ['$$item.date', timeRange.start] },
                                                        { $lte: ['$$item.date', timeRange.end] },
                                                        { $eq: ['$$item.status', 'WIDGET_PAYMENT'] },
                                                    ],
                                                },
                                            }
                                        }
                                    },
                                    in: { $setUnion: ['$$buyers.buyer.phone', []] }
                                }
                            }
                        }
                    },
                },
                {
                    $project: {
                        /**
                         * operations
                         */
                        percentOperations: {
                            $cond: {
                                if: { $eq: ['$previousOperations', 0] },
                                then: 0,
                                else: { $subtract: [{ $multiply: [{ $divide: ['$operations', '$previousOperations'] }, 100] }, 100] }
                            }
                        },
                        previousOperations: true,
                        operations: true,

                        /**
                         * sales
                         */
                        percentSales: {
                            $cond: {
                                if: { $eq: ['$previousSales', 0] },
                                then: 0,
                                else: { $subtract: [{ $multiply: [{ $divide: ['$sales', '$previousSales'] }, 100] }, 100] }
                            }
                        },
                        sales: true,
                        previousSales: true,

                        /**
                         * earnings
                         */
                        percentEarnings: {
                            $cond: {
                                if: { $eq: ['$previousEarnings', 0] },
                                then: 0,
                                else: { $subtract: [{ $multiply: [{ $divide: ['$earnings', '$previousEarnings'] }, 100] }, 100] }
                            }
                        },
                        earnings: true,
                        previousEarnings: true,

                        /**
                         * events
                         */
                        percentEvents: {
                            $cond: {
                                if: { $eq: ['$previousEvents', 0] },
                                then: 0,
                                else: { $subtract: [{ $multiply: [{ $divide: ['$events', '$previousEvents'] }, 100] }, 100] }
                            }
                        },
                        events: true,
                        previousEvents: true,

                        /**
                         * buyers
                         */
                        buyers: true,
                        previousBuyers: true,
                        percentBuyers: {
                            $cond: {
                                if: { $eq: ['$buyers', 0] },
                                then: 0,
                                else: { $multiply: [{ $divide: ['$previousBuyers', '$buyers'] }, 100] }
                            }
                        },


                        previousAverageEarnings: {
                            $cond: {
                                if: { $eq: ['$previousSales', 0] },
                                then: 0,
                                else: { $divide: ['$previousEarnings', '$previousSales'] }
                            }
                        },

                        averageEarnings: {
                            $cond: {
                                if: { $eq: ['$sales', 0] },
                                then: 0,
                                else: { $divide: ['$earnings', '$sales'] }
                            }
                        }
                    }
                }, {
                    $addFields: {
                        percentAverageEarnings: {
                            $cond: {
                                if: { $eq: ['$averageEarnings', 0] },
                                then: 0,
                                else: { $multiply: [{ $divide: ['$previousAverageEarnings', '$averageEarnings'] }, 100] }
                            }
                        }
                    }
                }
            ]);
        return (await request.allowDiskUse(true).exec()).shift();

    }

    /**
     *
     * @param stage
     * @param insulation
     * @description статистика устройств
     */
    async graphicsDevices(stage: DashboardObject, insulation: Record<string, object>): Promise<object> {
        const request = await this.operationsSchema.aggregate([
            { $match: insulation },
            { $group: { _id: null, devices: { $push: { name: '$os.name', status: '$status' } } } },
            {
                $project: {
                    _id: false,
                    devices: true,

                    transactions: {
                        phones: {
                            $size: {
                                $filter: {
                                    input: '$devices',
                                    as: 'item',
                                    cond: {
                                        $and: [
                                            { $in: ['$$item.name', ['iOS', 'Android']] },
                                            { $eq: ['$$item.status', 'WIDGET_PAYMENT'] }
                                        ]
                                    }
                                }
                            }
                        },

                        desktops: {
                            $size: {
                                $filter: {
                                    input: '$devices',
                                    as: 'item',
                                    cond: {
                                        $and: [
                                            { $in: ['$$item.name', ['OS X', 'Windows', 'Linux']] },
                                            { $eq: ['$$item.status', 'WIDGET_PAYMENT'] }
                                        ]
                                    }
                                }
                            }
                        }
                    },

                    operations: {
                        phones: {
                            $size: {
                                $filter: {
                                    input: '$devices',
                                    as: 'item',
                                    cond: {
                                        $and: [
                                            { $in: ['$$item.name', ['iOS', 'Android']] },
                                            { $ne: ['$$item.status', 'WIDGET_PAYMENT'] }
                                        ]
                                    }
                                }
                            }
                        },

                        desktops: {
                            $size: {
                                $filter: {
                                    input: '$devices',
                                    as: 'item',
                                    cond: {
                                        $and: [
                                            { $in: ['$$item.name', ['OS X', 'Windows', 'Linux']] },
                                            { $ne: ['$$item.status', 'WIDGET_PAYMENT'] }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    transactions: {
                        phones: 1,
                        desktops: 1,
                        others: {
                            $subtract: [{
                                $size: {
                                    $filter:
                                    {
                                        input: '$devices',
                                        as: 'item',
                                        cond: { $eq: ['$$item.status', 'WIDGET_PAYMENT'] }
                                    }
                                }
                            },
                            { $sum: ['$transactions.phones', '$transactions.desktops'] }]
                        }
                    },

                    operations: {
                        phones: 1,
                        desktops: 1,
                        others: {
                            $subtract: [{
                                $size: {
                                    $filter:
                                    {
                                        input: '$devices',
                                        as: 'item',
                                        cond: { $ne: ['$$item.status', 'WIDGET_PAYMENT'] }
                                    }
                                }
                            },
                            { $sum: ['$operations.phones', '$operations.desktops'] }]
                        }
                    }
                }
            }
        ]).exec()

        return request[0] || null;
    }

    async graphicsSalesNew() {
        const dates = [new Date(2019, 9, 1), new Date()];
        const d_c = [new Date(2019, 9, 1), new Date()];
        dates[0].setUTCHours(0, 0, 0, 0);

        const end_date = new Date(dates[0]);
        const distance = (Math.ceil(Math.abs(dates[1].getTime() -
            dates[0].getTime()) / (1000 * 3600 * 24))) || 1;
        const hours = (distance * 24) / 12;

        const c = new Array(12).fill(1).map(() => {
            try {
                end_date.setUTCHours(end_date.getUTCHours() + hours);
                end_date.setUTCMilliseconds(end_date.getUTCMilliseconds() - 1)
                end_date.setUTCHours(end_date.getUTCHours(), end_date.getUTCMinutes(), end_date.getUTCSeconds(), 999)

                return {
                    start: new Date(dates[0]),
                    end: new Date(end_date)
                }
            } finally {
                dates[0].setUTCHours(dates[0].getUTCHours() + hours);
            }
        });


        let req = this.operationsSchema.aggregate([]);

        req.match({
            status: "WIDGET_PAYMENT",
            date: {
                $gte: d_c[0],
                $lte: d_c[1]
            }
        })

        req.addFields({
            _stage_0: {
                $filter: {
                    input: c,
                    as: "cc",
                    cond: {
                        $and: [
                            { $gte: ["$date", "$$cc.start"] },
                            { $lte: ["$date", "$$cc.end"] }
                        ]
                    }
                }
            }
        })
            .group({
                _id: "$_stage_0",
                q: { $sum: 1 }
            })
            .group({
                _id: null,
                xAxis: { $push: "$q" },
                yAxis: {
                    $push: { $arrayElemAt: ["$_id", 0] }
                }
            })
            .project({
                _id: false,
                yAxis: true,
                xAxis: true
            })

        console.log(JSON.stringify(await req.exec()))
    }

    async graphicsSales(stage: DashboardObject, insulation: Record<string, object>): Promise<object> {
        const { date } = insulation;

        const distance = (Math.ceil(Math.abs(new Date(date['$lte']).getTime() -
            new Date(date['$gte']).getTime()) / (1000 * 3600 * 24))) || 1;

        if (distance == 1) {
            date['$gte'].setUTCDate(date['$gte'].getUTCDate() + 1)
        }

        const start = new Date(date['$gte']),
            end = new Date(date['$gte']);

        const hours = (distance * 24) / 24;


        const filterSales = [],
            filterTickets = [],
            filterOperations = [],
            filterDates = [],
            filterUsers = [];

        for (let x = 0; x < 24; x++) {
            end.setUTCHours(end.getUTCHours() + hours);
            end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);

            filterDates.push([start.toISOString(), end.toISOString()]);
            filterSales.push({
                $size: {
                    $filter: {
                        input: '$operations',
                        as: 'as',
                        cond: {
                            $and: [
                                { $gte: ['$$as.date', { $toDate: start.toISOString() }] },
                                { $lte: ['$$as.date', { $toDate: end.toISOString() }] },
                                { $eq: ['$$as.status', 'WIDGET_PAYMENT'] }
                            ]
                        }
                    }
                }
            });
            filterOperations.push({
                $size: {
                    $filter: {
                        input: '$operations',
                        as: 'as',
                        cond: {
                            $and: [
                                { $gte: ['$$as.date', { $toDate: start.toISOString() }] },
                                { $lte: ['$$as.date', { $toDate: end.toISOString() }] },
                                { $ne: ['$$as.status', 'WIDGET_PAYMENT'] }
                            ]
                        }
                    }
                }
            });
            filterTickets.push({
                $let: {
                    vars: {
                        values: {
                            $reduce: {
                                input: {
                                    $filter: {
                                        input: '$operations',
                                        as: 'as',
                                        cond: {
                                            $and: [
                                                { $gte: ['$$as.date', { $toDate: start.toISOString() }] },
                                                { $lte: ['$$as.date', { $toDate: end.toISOString() }] },
                                                { $eq: ['$$as.status', 'WIDGET_PAYMENT'] }
                                            ]
                                        }
                                    }
                                },
                                initialValue: [],
                                in: { $concatArrays: ['$$value', '$$this.tickets'] }
                            }
                        }
                    },

                    in: { $sum: '$$values.quantity' }
                }
            });
            filterUsers.push({
                $let: {
                    vars: {
                        values: {
                            $filter: {
                                input: '$operations',
                                as: 'as',
                                cond: {
                                    $and: [
                                        { $gte: ['$$as.date', { $toDate: start.toISOString() }] },
                                        { $lte: ['$$as.date', { $toDate: end.toISOString() }] },
                                        { $eq: ['$$as.status', 'WIDGET_PAYMENT'] },
                                        { $ne: ['$$as.phone', null] }
                                    ]
                                }
                            }

                        }
                    },
                    in: { $size: { $setUnion: ['$$values.phone'] } }
                }
            });

            start.setUTCHours(start.getUTCHours() + hours);
        }


        return await this.operationsSchema.aggregate()
            .match(insulation)
            .group({
                _id: '$_id', date: { $last: '$date' }, phone: { $last: '$buyer.phone' },
                status: { $last: '$status' }, tickets: { $last: '$tickets' }
            })
            .group({ _id: null, operations: { $push: '$$CURRENT' } })
            .project({ _id: false, filterOperations, filterSales, filterTickets, filterUsers, filterDates })
            .exec()
            .then(resolve => {
                resolve = resolve.shift() || {};

                return {
                    error: null,
                    then: {
                        graphics: {
                            sales: resolve['filterSales'] || [],
                            operations: resolve['filterOperations'] || [],
                            tickets: resolve['filterTickets'] || [],
                            users: resolve['filterUsers'] || []
                        },

                        meta: {
                            dates: resolve['filterDates'] || []
                        },

                        api: 'v2'
                    }
                }
            }).catch(resolve => {
                console.error(resolve);
                return {
                    error: {
                        message: 'an error occurred while generating the report'
                    },
                    then: null
                }
            });
    }

    async graphicsLocation(stage: DashboardObject, insulation: Record<string, object>): Promise<object> {
        const request = (await this.operationsSchema
            .aggregate([
                {
                    $match: {
                        ...insulation, status: 'WIDGET_PAYMENT',
                        'addressInfo.city': { $exists: true, $ne: null }
                    }
                },
                { $group: { _id: '$addressInfo.city', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
                { $project: { _id: false, name: '$_id', count: true } },
                { $group: { _id: null, labels: { $push: '$name' }, data: { $push: '$count' } } },
                { $project: { _id: false } }
            ])
            .exec());
        return request.shift()
    }

    async graphicsSalesRanking(stage: DashboardObject, insulation: Record<string, object>): Promise<object> {
        const request = await this.operationsSchema.aggregate([
            {
                $match: {
                    'event.name': { $exists: true, $ne: null },
                    status: 'WIDGET_PAYMENT',
                    ...insulation
                },
            },
            { $group: { _id: '$event.name', count: { $sum: 1 } }, },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: false,
                    name: '$_id',
                    count: true,
                },
            },

            { $group: { _id: null, events: { $push: '$$CURRENT' } } },
            { $project: { _id: false, total: { $sum: '$events.count' }, events: true } },
            { $unwind: '$events' },
            {
                $group: {
                    _id: null,
                    events: {
                        $push: {
                            name: '$events.name',
                            sales: '$events.count',
                            percent: { $floor: { $multiply: [{ $divide: ['$events.count', '$total'] }, 100] } }
                        }
                    }
                }
            },
            { $project: { _id: false } }
        ]).exec()

        return request.shift();
    }

    async graphicsNewBuyers(stage: DashboardObject, insulation: Record<string, object>): Promise<object> {
        const request = await this.operationsSchema.aggregate([
            {
                $match: {
                    source: insulation.source, status: 'WIDGET_PAYMENT',
                    'buyer.phone': { $exists: true, $ne: null }
                }
            },
            { $group: { _id: '$buyer.phone', date: { $first: '$date' } } },
            { $group: { _id: null, buyers: { $push: '$$CURRENT' } } },
            {
                $project: {
                    _id: false,
                    buyers: {
                        $size: '$buyers'
                    },

                    previousBuyers: {
                        $size: {
                            $filter: {
                                input: '$buyers',
                                as: 'item',
                                cond: {
                                    $and: [
                                        { $gte: ['$$item.date', insulation['date']['$gte']] },
                                        { $lte: ['$$item.date', insulation['date']['$lte']] }
                                    ],
                                },
                            }
                        }
                    }
                }
            }
        ]).exec();

        return request.shift()
    }

    async graphicsSalesTicket(stage: DashboardObject, insulation: Record<string, object>): Promise<object> {
        const request = this.operationsSchema.aggregate([
            {
                $match: {
                    ...insulation,
                    status: 'WIDGET_PAYMENT',
                    tickets: { $exists: true, $ne: null },
                    'tickets.quantity': { $gte: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    tickets: {
                        $push: {
                            quantity: { $sum: '$$CURRENT.tickets.quantity' }
                        }
                    }
                }
            },
            { $project: { _id: false, tickets: '$tickets.quantity' } },
            { $unwind: '$tickets' },
            { $group: { _id: '$$CURRENT.tickets', count: { $sum: 1 } } },
            { $project: { tickets: '$_id', count: true } },
            { $group: { _id: null, total: { $push: '$$CURRENT' } } },
            {
                $project: {
                    _id: false,
                    data: [
                        /** one ticket */
                        {
                            $let: {
                                vars: {
                                    ticket: {
                                        $filter: {
                                            input: '$total',
                                            as: 'item',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$item.tickets', 1] },
                                                ],
                                            },
                                        }
                                    }
                                },
                                in: { $sum: '$$ticket.count' }
                            }
                        },

                        /** two ticket */
                        {
                            $let: {
                                vars: {
                                    ticket: {
                                        $filter: {
                                            input: '$total',
                                            as: 'item',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$item.tickets', 2] },
                                                ],
                                            },
                                        }
                                    }
                                },
                                in: { $sum: '$$ticket.count' }
                            }
                        },

                        /** three ticket */
                        {
                            $let: {
                                vars: {
                                    ticket: {
                                        $filter: {
                                            input: '$total',
                                            as: 'item',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$item.tickets', 3] },
                                                ],
                                            },
                                        }
                                    }
                                },
                                in: { $sum: '$$ticket.count' }
                            }
                        },

                        /**
                         * foo ticket
                         */
                        {
                            $let: {
                                vars: {
                                    ticket: {
                                        $filter: {
                                            input: '$total',
                                            as: 'item',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$item.tickets', 4] },
                                                ],
                                            },
                                        }
                                    }
                                },
                                in: { $sum: '$$ticket.count' }
                            }
                        },

                        /**
                         * more
                         */
                        {
                            $let: {
                                vars: {
                                    ticket: {
                                        $filter: {
                                            input: '$total',
                                            as: 'item',
                                            cond: {
                                                $and: [
                                                    { $gte: ['$$item.tickets', 5] },
                                                ],
                                            },
                                        }
                                    }
                                },
                                in: { $sum: '$$ticket.count' }
                            }
                        },
                    ]
                }
            }


        ]);
        return (await request.exec()).shift();
    }
}
