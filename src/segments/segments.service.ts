import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {OperationObject} from '../transferDataObject/buyers/OperationObject';
import {Model} from 'mongoose';
import {ObjectId} from 'bson';
import {Segments, SegmentCreate, SegmentDetailUsers} from './segment.schema';
import {SegmentExecuteDTO} from "./DTO/SegmentExecuteDTO";

@Injectable()
export class SegmentsService {
    private segmentsQueue: number[] = [];

    constructor(
        @InjectModel('buyers')
        private readonly operationSchema: Model<OperationObject>,
        @InjectModel('segments')
        private readonly segmentSchema: Model<Segments>) {
        setInterval(this.screen.bind(this), 1000);
    }

    async screen() {
        this.segmentSchema.find({enable: true, automation: true, updates: false}, function (err, segments) {
            if (err) return console.error(err);
            for (let segmentAddress in segments) {
                const segment = segments[segmentAddress] as Segments;
                const current = new Date();
                if ((current.getTime() / 1000) - (Date.parse(segment.last.toISOString()) / 1000) < 60)
                    continue;

                this.segmentSchema.findByIdAndUpdate(new ObjectId(segment._id),
                    {enable: false, updates: true, last: new Date()}, function (err) {
                        if (err) return console.log(err);
                        this.buildSegment(segment)
                    }.bind(this))
            }
        }.bind(this))
    }

    async users(details: SegmentDetailUsers, userId: ObjectId): Promise<object> {
        return await this.segmentSchema
            .aggregate()
            .match({_id: new ObjectId(details.segment), access: {$elemMatch: {$eq: userId}}})
            .group({_id: null, buyers: {$first: '$then.buyers'}})
            .unwind('buyers')
            .sort({'buyers.lastActivity': -1})
            .group({_id: null, buyers: {$push: '$buyers'}, length: {$sum: 1}})
            .project({buyers: {$slice: ['$buyers', details.offset * 10, 10]}, length: true})
            .exec()
            .then(resolve => {
                if (resolve.length) {
                    if (resolve[0]['buyers'] || resolve[0]['length']) {
                        return {
                            error: null,
                            then: {
                                length: resolve[0]['length'] || 0,
                                users: resolve[0]['buyers'] || []
                            }
                        }
                    }
                }

                return {
                    error: null,
                    then: {
                        length: 0,
                        users: []
                    }
                }
            }).catch(() => {
                return {
                    error: {
                        message: 'at the receiving stage, an error occurred'
                    }
                }
            })
    }

    async get(segmentId: ObjectId, userId: ObjectId): Promise<object> {
        return await this.segmentSchema.findOne({
            _id: segmentId,
            access: {$elemMatch: {$eq: userId}},
            updates: false,
            enable: true
        }, {
            sources: true,
            last: true,
            'then.users': true,
            'then.stats': true,
            'then.devices': true,
            'then.events': true,
            'then.locations': true,
        }).exec().then(resolve => {
            if (resolve) return resolve
            return {
                error: {
                    message: 'segment not found'
                }
            }
        })
    }

    async getSegmentUsers(segmentId: ObjectId, userId: ObjectId): Promise<object> {

        return null
    }

    async buildSegment(segment: Segments): Promise<void> {
        const mutex = async function (): Promise<void> {
            await new Promise(resolve => {
                setTimeout(resolve, 5000)
            });

            if (this.segmentsQueue.length >= 10) {
                return await mutex.bind(this)()
            }

            return
        };

        await mutex.bind(this)();

        const request = this.operationSchema.aggregate()
        request
            .allowDiskUse(true)

        request
            .match({
                status: 'WIDGET_PAYMENT',
                source: {$in: segment.sources || []},
                buyer: {$exists: true}
            });

        await request
            .group({
                _id: '$buyer.phone',
                firstPaymentDate: {$first: '$date'},
                lastPaymentDate: {$last: '$date'},
                paymentDates: {$push: {$dayOfWeek: {date: '$date', timezone: 'Europe/Moscow'}}},
                tickets: {$push: '$tickets'}
            })
            .addFields({
                tickets: {
                    $reduce: {
                        input: '$tickets',
                        initialValue: [],
                        in: {$concatArrays: ['$$value', '$$this']},
                    }
                }
            })
            .addFields({
                earnings: {
                    $reduce: {
                        input: '$tickets',
                        initialValue: 0,
                        in: {
                            $add: ['$$value', {
                                $cond: {
                                    if: {$eq: ['$this.quantity', 1]},
                                    then: '$$this.price',
                                    else: {
                                        $multiply: ['$$this.price', '$$this.quantity'],
                                    },
                                },
                            }],
                        },
                    },
                },

                tickets: {$sum: '$tickets.quantity'}
            })
            .sort({'lastPaymentDate': -1})
            .project({
                _id: false,
                phone: '$_id',
                paymentDates: true,
                lastPaymentDate: true,
                firstPaymentDate: true,
                earnings: true,
                tickets: true
            })
            .then(async users => {
                users = users.map(user => {
                    const popularDays = {
                        sunday: 0,
                        monday: 0,
                        tuesday: 0,
                        wednesday: 0,
                        thursday: 0,
                        friday: 0,
                        saturday: 0
                    }

                    const popularDaysKeys = Object.keys(popularDays)
                    user.paymentDates.forEach((resolve: number) => popularDays[popularDaysKeys[resolve - 1]]++)

                    return {
                        popularDays,
                        phone: user.phone,
                        activityDate: user.lastPaymentDate,
                        initActivityDate: user.firstPaymentDate,
                        earnings: user.earnings,
                        tickets: user.tickets
                    }
                })

                const databaseUsers = users.length

                const current = new Date()
                const earnings = users.reduce((accumulator, current) => {
                    return accumulator + current.earnings
                }, 0)
                const earningsAverage = earnings / databaseUsers

                const paymentBill33 = (33 / 100) * earningsAverage
                const paymentBill72 = (72 / 100) * earningsAverage

                let filters = users.filter(resolve => {
                    const lastActivity = (current.getTime() / 1000) -
                        (Date.parse(resolve.activityDate) / 1000)
                    const firstActivity = (current.getTime() / 1000) -
                        (Date.parse(resolve.initActivityDate) / 1000)

                    switch (segment.target) {
                        case 'buyers->new': {
                            return firstActivity < (3600 * 24 * 7)
                        }

                        case 'buyers->month': {
                            return lastActivity > (3600 * 24 * 30)
                        }

                        case 'buyers->quarter': {
                            return lastActivity > (3600 * 24 * 90)
                        }

                        case 'buyers->half-year': {
                            return lastActivity > (3600 * 24 * 180)
                        }

                        case 'buyers->weekends': {
                            return resolve.popularDays.sunday >= 2 ||
                                resolve.popularDays.saturday >= 2
                        }

                        case 'buyers->friday': {
                            return resolve.popularDays.friday >= 2
                        }

                        case 'buyers->average:bill(33)': {
                            console.log(resolve.earnings / resolve.tickets, paymentBill33)
                            return resolve.earnings / resolve.tickets <= paymentBill33
                        }

                        case 'buyers->average:bill(72)': {
                            return resolve.earnings / resolve.tickets < paymentBill72
                                && resolve.earnings / resolve.tickets > paymentBill33
                        }
                        case 'buyers->average:bill(100)': {
                            return resolve.earnings / resolve.tickets >= paymentBill72
                        }

                        default: {
                            return false
                        }
                    }
                });

                filters = filters.filter(resolve => resolve.phone).map(resolve => resolve.phone)

                /**
                 * build segment
                 * @description
                 * получения информации о пользователях в сегменте
                 */

                if (!filters.length) {
                    await this.segmentSchema.updateOne({_id: new ObjectId(segment._id)}, {
                        updates: false,
                        enable: true,
                        then: {
                            users: {segment: 0, database: databaseUsers},
                            stats: {earnings: 0, averageEarnings: 0, orders: 0, averageUserEarnings: 0},
                            events: [],
                            devices: {computer: 0, phone: 0},
                            locations: [],
                            buyers: []
                        }
                    } as Segments).exec().then(resolve => {
                        console.log('segment is build')
                    })

                    return
                }

                await this.operationSchema.aggregate()
                    .allowDiskUse(true)
                    .match({
                        status: 'WIDGET_PAYMENT',
                        source: {$in: segment.sources},
                        'buyer.phone': {$in: filters}
                    }).group({
                        _id: null,
                        length: {$sum: 1},
                    }).project({
                        segment: '$length',
                    }).then(async resolve => {
                        const segmentUsers = {
                            database: databaseUsers,
                            segment: filters.length
                        }

                        await this.operationSchema.aggregate()
                            .allowDiskUse(true)
                            .match({
                                status: 'WIDGET_PAYMENT',
                                source: {$in: segment.sources},
                                'buyer.phone': {$in: filters}
                            })
                            .group({_id: null, operations: {$push: '$$CURRENT'}})
                            .addFields({
                                tickets: {
                                    $reduce: {
                                        input: '$operations.tickets',
                                        initialValue: [],
                                        in: {$concatArrays: ['$$value', '$$this']},
                                    },
                                }
                            })
                            .addFields({
                                earnings: {
                                    $reduce: {
                                        input: '$tickets',
                                        initialValue: 0,
                                        in: {
                                            $add: [
                                                '$$value',
                                                {
                                                    $cond: {
                                                        if: {$eq: ['$this.quantity', 1]},
                                                        then: '$$this.price',
                                                        else: {
                                                            $multiply: ['$$this.price', '$$this.quantity'],
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                }
                            })
                            .project({
                                orders: {$size: '$operations'},
                                earnings: true,
                                devices: {
                                    computer: {
                                        $size: {
                                            $filter: {
                                                input: '$operations',
                                                as: 'operation',
                                                cond: {
                                                    $in: ['$$operation.os.name', [
                                                        "Chrome OS aarch64",
                                                        "Windows Server 2003 / XP 64-bit",
                                                        "Windows Server 2008 R2 / 7", "OS X",
                                                        "Windows", "Linux",
                                                        "Windows XP",
                                                        "Windows Server 2008 / Vista",
                                                        "Linux i686",
                                                        "OpenBSD",
                                                        "Ubuntu", "Chrome OS",
                                                        "Ubuntu Chromium"]]
                                                }
                                            }
                                        }
                                    },

                                    phone: {
                                        $size: {
                                            $filter: {
                                                input: '$operations',
                                                as: 'operation',
                                                cond: {
                                                    $in: ['$$operation.os.name', [
                                                        "Windows Phone",
                                                        "BlackBerry",
                                                        "Windows Phone 8.x",
                                                        "Android", "iOS"]]
                                                }
                                            }
                                        }
                                    }
                                }
                            }).then(async resolve => {
                                resolve = resolve.shift()

                                const segmentData = {
                                    earnings: Number(resolve['earnings'] || 0),
                                    averageEarnings: resolve['orders'] ? resolve['earnings'] / resolve['orders'] : 0,
                                    averageUserEarnings: filters.length ? resolve['earnings'] / filters.length : 0,
                                    orders: Number(resolve['orders'])
                                }, segmentDevices = resolve['devices'] || {computer: 0, phone: 0}


                                await this.operationSchema.aggregate()
                                    .allowDiskUse(true)
                                    .match({
                                        status: 'WIDGET_PAYMENT',
                                        source: {$in: segment.sources},
                                        'buyer.phone': {$in: filters},
                                        'event.name': {$ne: null, $exists: true}
                                    }).group({
                                        _id: '$event.name',
                                        count: {$sum: 1}
                                    })
                                    .sort({count: -1})
                                    .limit(10)
                                    .group({_id: null, events: {$push: {name: '$_id', sales: '$count'}}})
                                    .addFields({total: {$sum: '$events.sales'}})
                                    .unwind('events')
                                    .addFields({percent: {$floor: [{$multiply: [{$divide: ['$events.sales', '$total']}, 100]}]}})
                                    .project({
                                        _id: false,
                                        name: '$events.name',
                                        share: '$percent',
                                        quantity: '$events.sales'
                                    }).then(async events => {
                                        await this.operationSchema.aggregate()
                                            .allowDiskUse(true)
                                            .match({
                                                status: 'WIDGET_PAYMENT',
                                                source: {$in: segment.sources},
                                                'buyer.phone': {$in: filters},
                                                'addressInfo.city': {$ne: null, $exists: true}
                                            }).group({
                                                _id: '$addressInfo.city',
                                                count: {$sum: 1}
                                            })
                                            .sort({count: -1})
                                            .limit(10)
                                            .project({
                                                _id: false,
                                                name: '$_id',
                                                quantity: '$count'
                                            }).then(async segmentLocations => {
                                                await this.operationSchema.aggregate()
                                                    .match({
                                                        status: 'WIDGET_PAYMENT',
                                                        source: {$in: segment.sources},
                                                        'buyer.phone': {$in: filters}
                                                    })
                                                    .group({
                                                        _id: '$buyer.phone',
                                                        tickets: {$push: '$tickets'},
                                                        lastActivity: {$last: '$date'},
                                                        firstActivity: {$first: '$date'},
                                                        name: {$last: '$buyer.name'},
                                                        gender: {$last: '$buyer.gender'},
                                                        source: {$last: '$source'},
                                                        transactions: {$sum: 1},
                                                        event: {$last: '$event.name'}
                                                    })
                                                    .addFields({
                                                        tickets: {
                                                            $reduce: {
                                                                input: '$tickets',
                                                                initialValue: [],
                                                                in: {$concatArrays: ['$$value', '$$this']},
                                                            }
                                                        }
                                                    })
                                                    .addFields({
                                                        earnings: {
                                                            $reduce: {
                                                                input: '$tickets',
                                                                initialValue: 0,
                                                                in: {
                                                                    $add: ['$$value', {
                                                                        $cond: {
                                                                            if: {$eq: ['$this.quantity', 1]},
                                                                            then: '$$this.price',
                                                                            else: {
                                                                                $multiply: ['$$this.price', '$$this.quantity'],
                                                                            },
                                                                        },
                                                                    }],
                                                                },
                                                            },
                                                        },

                                                        tickets: {$sum: '$tickets.quantity'}
                                                    }).exec().then(async users => {
                                                        await this.segmentSchema.updateOne({_id: new ObjectId(segment._id)}, {
                                                            updates: false,
                                                            enable: true,
                                                            then: {
                                                                users: segmentUsers,
                                                                stats: segmentData,
                                                                events: events,
                                                                devices: segmentDevices,
                                                                locations: segmentLocations,
                                                                buyers: users
                                                            }
                                                        } as Segments).exec().then(resolve => {
                                                            console.log('segment is build')
                                                        })
                                                    })
                                            })
                                    })
                            })
                    })
            });

        this.segmentsQueue.shift()
    }

    async create(segment: SegmentCreate, user: object): Promise<object> {
        if (!segment.sources.every(resolve => user['sources'].includes(resolve))) {
            return {
                error: {
                    message: 'error when specifying the source'
                }
            }
        }

        const segmentObject = await new this.segmentSchema({
            _id: new ObjectId(),
            name: segment.name,
            target: segment.target,
            sources: segment.sources,
            enable: false,
            updates: true,
            access: [new ObjectId(user['_id'])],
            last: new Date()
        } as Segments).save().then((segment: Segments) => {
            this.buildSegment(segment);


            return {
                error: null,
                then: {
                    message: 'OK'
                }
            }
        }).catch((error) => {
            console.log(error)
            return {
                error: {
                    message: 'an error occurred while creating the segment'
                }
            }
        })

        return segmentObject
    }

    async list(userId: ObjectId): Promise<object[]> {
        const request = await this.segmentSchema.find({
            access: {$elemMatch: {$eq: userId}}
        }, {
            _id: true,
            name: true,
            enable: true,
            updates: true,
            last: true,
            automation: true,
            'then.users': true,
            'then.stats': true
        }).sort({last: -1}).exec().catch(() => {
            return []
        })

        return request;
    }

    async configure(info: SegmentExecuteDTO, user: object) {
        switch (info.command) {
            case "segment->update":
                return await this.segmentSchema.findOne({_id: new ObjectId(info.segment), enable: true, updates: false})
                    .exec()
                    .then(async (segment: Segments) => {
                        if(!segment) {
                            throw  new Error('segment not found or already in use')
                        }

                        const current = new Date();
                        if ((current.getTime() / 1000) - (Date.parse(segment.last.toISOString()) / 1000) < 60)
                            throw  new Error('1 minute has passed since the last flashing');

                       return await this.segmentSchema.findByIdAndUpdate(new ObjectId(segment._id),
                            {enable: false, updates: true, last: new Date()})
                            .exec()
                            .then(() => {
                                this.buildSegment(segment);
                                return {
                                    error: null,
                                    then: {
                                        code: 'success',
                                        message: 'segment queued for update'
                                    }
                                }
                            });
                    }).catch(message => {
                        return {
                            error: {
                                message: message.toString()
                            },

                            then: null
                        }
                    });
            case "segment->remove":
                return await this.segmentSchema.deleteOne({
                    _id: new ObjectId(info.segment),
                    access: {$elemMatch: {$eq: new ObjectId(user['_id'])}}
                }).exec().then(resolve => {
                    return 'OK';
                });
            case "segment->automatic":
                if(info.automation == null || info.automation == undefined) {
                    throw new BadRequestException();
                }

                return await this.segmentSchema.findByIdAndUpdate(new ObjectId(info.segment), {
                    automation: info.automation
                })
                    .exec()
                    .then(resolve => {
                        return {
                            error: null,
                            then: {
                                message: 'the flag is set'
                            }
                        }
                    }).catch(error => {
                        return {
                            error: {
                                message: error
                            },

                            then: null
                        }
                    });

            default:
                return null;
        }
    }
}
