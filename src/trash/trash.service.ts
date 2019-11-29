import {Injectable} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {OperationObject} from "../transferDataObject/buyers/OperationObject";
import {Segments} from "../segments/segment.schema";

@Injectable()
export class TrashService {
    constructor(
        @InjectModel('buyers')
        private readonly operationSchema: Model<OperationObject>,
        @InjectModel('segments')
        private readonly segmentSchema: Model<Segments>
    ) {
    }

    async analysis(addresses: string[]) {

        const m_dateEnd = new Date(Date.UTC(2019, 10, 15, 23, 59, 59)),
            m_dateStart = new Date(Date.UTC(2019, 10, 15, 0, 0, 0));

        const payments = await this.operationSchema.aggregate()
            .match({
                status: 'WIDGET_PAYMENT',
                date: {
                    $gte: m_dateStart,
                    $lte: m_dateEnd
                },
            })
            .group({_id: '$buyer.phone', length: {$sum: 1}, tickets: {$push: '$tickets'}})
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
                }
            })
            .group({_id: null, length: {$sum: 1}, payments: {$sum: '$length'}, earnings: {$sum: '$earnings'}})
            .project({length: true, payments: true, earnings: true})
            .exec().then((resolve) => {
                resolve = resolve.shift();

                return {
                    users: resolve.length,
                    length: resolve.payments,
                    earnings: resolve.earnings
                }
            });

        const operations = await this.operationSchema.aggregate()
            .match({
                status: {$ne: 'WIDGET_PAYMENT'},
                date: {
                    $gte: m_dateStart,
                    $lte: m_dateEnd
                },
                source: {$in: addresses}
            })
            .group({_id: '$analytics.google', length: {$sum: 1}})
            .group({_id: null, length: {$sum: '$length'}})
            .lookup({
                from: 'sheets',
                pipeline: [
                    {
                        $match:
                            {
                                $expr:
                                    {
                                        $and: [
                                            {$in: ["$source", addresses]},
                                            {$gte: ['$date', m_dateStart]},
                                            {$lte: ['$date', m_dateEnd]}
                                        ]
                                    }
                            }
                    },

                    {
                        $group: {
                            _id: null,
                            length: {$sum: 1}
                        }
                    }
                ],
                as: 'sheets'
            })
            .project({length: true, sheets: '$sheets.length'})
            .exec().then((resolve) => {
                const {length, sheets} = resolve.shift();
                return {length, sheets}
            });


        return {
            payments,
            operations
        };
    }

    async addresses() {
        return await this.operationSchema.aggregate()
            .match({
                'addressInfo.city': {$in: ['Moscow', 'Москва']}
            })
            .group({_id: {$toString: '$addressInfo.zip'}, length: {$sum: 1}})
            .addFields({district: 'Определить', office: 'Определить'},)
            .exec()
            .then(resolve => {
                return resolve
            })
    }
}
