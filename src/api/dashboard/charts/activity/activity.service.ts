import { Injectable } from '@nestjs/common';
import { LocaleDate } from 'src/utils/LocalDate';
import { IUser } from '../../../../account/types/IUser';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IActionSchema } from '../../../../database/Schemas/IActionSchema';
import { IPaymentSchema } from '../../../../database/Schemas/IPaymentsSchema';

@Injectable()
export class ActivityService {
    constructor(@InjectModel('buyers') private readonly actionsSchema: Model<IActionSchema>,
        @InjectModel('t_payments') private readonly paymentsSchema: Model<IPaymentSchema>) { }
    async GetActivity(localeDate: LocaleDate, user: IUser) {
        const _localeDateStart = localeDate.toDate("primary");
        const _localeDateEnd = localeDate.toDate("primary");

        const _distance = (Math.ceil(Math.abs(localeDate.toDate("second").getTime() -
            _localeDateStart.getTime()) / (1000 * 3600 * 24))) || 1,
            _hours = _distance * 24 / 12;

        const _fillIncisionTimes = new Array(12)
            .fill(0)
            .map(_ => {
                try {
                    _localeDateEnd.setUTCHours(_localeDateEnd.getUTCHours()
                        + _hours);
                    _localeDateEnd.setUTCMilliseconds(_localeDateEnd.getUTCMilliseconds()
                        - 1);
                    _localeDateEnd.setUTCHours(_localeDateEnd.getUTCHours(),
                        _localeDateEnd.getUTCMinutes(),
                        _localeDateEnd.getUTCSeconds(), 999);

                    return {
                        _primaryTimeStamp: new Date(_localeDateStart),
                        _secondTimeStamp: new Date(_localeDateEnd)
                    }
                } finally {
                    _localeDateStart.setUTCHours(_localeDateStart.getUTCHours()
                        + _hours);
                }
            }).sort((x, y) => x._primaryTimeStamp.getTime() - y._primaryTimeStamp.getTime());

            console.log("okey, wait then");
        try {
            console.time("dev")
            return await Promise.all([
                this.getTransaction(_fillIncisionTimes, localeDate, user.access),
                this.getActions(_fillIncisionTimes, localeDate, user.access),
                this.getAddedUsers(_fillIncisionTimes, localeDate, user.access)
            ]).then(function (resolve) {
                return {
                    transactions: resolve[0],
                    operations: resolve[1],
                    users: resolve[2]
                }
            });
        } finally {
            console.timeEnd("dev")
        }
    }

    /**
     * @returns {Promise<{xAxis: Array<Number>, yAxis: Array<Object>}>}
     * @param localeTimeStamp 
     * @param localeDate 
     * @param access 
     */
    async getActions(localeTimeStamp: { _primaryTimeStamp: Date, _secondTimeStamp: Date }[], localeDate: LocaleDate, access: string[]) {
        const _req = this.actionsSchema.aggregate([]);
        _req.match({ access: { $in: access }, date: { $gte: localeDate.toDate("primary"), $lte: localeDate.toDate("second") }, status: { $ne: "WIDGET_PAYMENT" } });
        _req.addFields({
            _stage_0: {
                $filter: {
                    input: localeTimeStamp, as: "qq", cond: {
                        $and: [{ $gte: ["$date", "$$qq._primaryTimeStamp"] },
                        { $lte: ["$date", "$$qq._secondTimeStamp"] }]
                    }
                }
            }
        });
        _req.group({ _id: "$_stage_0", q: { $sum: 1 } });
        _req.sort({ "_id._primaryTimeStamp": 1 })
        _req.group({ _id: null, xAxis: { $push: "$q" }, yAxis: { $push: { $arrayElemAt: ["$_id", 0] } } });
        _req.project({ _id: false, xAxis: true, yAxis: true });

        const _state = (await _req.exec())[0] || {
            xAxis: [],
            yAxis: []
        };

        const xAxis = new Array(12).fill(0).map((_, index) => {
            const _localeTimeStamp = localeTimeStamp[index];
            const __state = _state.yAxis.findIndex((x: { _primaryTimeStamp: Date, _secondTimeStamp: Date }) => {
                if (_localeTimeStamp._primaryTimeStamp.getTime() == x._primaryTimeStamp.getTime()
                    && _localeTimeStamp._secondTimeStamp.getTime() == x._secondTimeStamp.getTime())
                    return true;

                return false;
            });

            return __state >= 0 ? _state.xAxis[__state] : 0;
        });

        return {
            xAxis,
            yAxis: JSON.parse(JSON.stringify(localeTimeStamp.map(x => {
                return { x: x._primaryTimeStamp, y: x._secondTimeStamp };
            })))
        };
    }

    /**
     * @returns {Promise<{xAxis: Array<Number>, yAxis: Array<Object>}>}
     * @param localeTimeStamp 
     * @param localeDate 
     * @param access 
     */
    async getAddedUsers(localeTimeStamp: { _primaryTimeStamp: Date, _secondTimeStamp: Date }[], localeDate: LocaleDate, access: string[]) {
        const _req = this.paymentsSchema.aggregate([]);
        _req.match({ access: { $in: access }, firstTransactionTime: { $gte: localeDate.toDate("primary"), $lte: localeDate.toDate("second") } });
        _req.addFields({
            _stage_0: {
                $filter: {
                    input: localeTimeStamp, as: "qq", cond: {
                        $and: [{ $gte: ["$firstTransactionTime", "$$qq._primaryTimeStamp"] },
                        { $lte: ["$firstTransactionTime", "$$qq._secondTimeStamp"] }]
                    }
                }
            }
        });
        _req.group({ _id: "$_stage_0", q: { $sum: 1 } });
        _req.sort({ "_id._primaryTimeStamp": 1 })
        _req.group({ _id: null, xAxis: { $push: "$q" }, yAxis: { $push: { $arrayElemAt: ["$_id", 0] } } });
        _req.project({ _id: false, xAxis: true, yAxis: true });

        const _state = (await _req.exec())[0] || {
            xAxis: [],
            yAxis: []
        };

        const xAxis = new Array(12).fill(0).map((_, index) => {
            const _localeTimeStamp = localeTimeStamp[index];
            const __state = _state.yAxis.findIndex((x: { _primaryTimeStamp: Date, _secondTimeStamp: Date }) => {
                if (_localeTimeStamp._primaryTimeStamp.getTime() == x._primaryTimeStamp.getTime()
                    && _localeTimeStamp._secondTimeStamp.getTime() == x._secondTimeStamp.getTime())
                    return true;

                return false;
            });

            return __state >= 0 ? _state.xAxis[__state] : 0;
        });

        return {
            xAxis,
            yAxis: JSON.parse(JSON.stringify(localeTimeStamp.map(x => {
                return { x: x._primaryTimeStamp, y: x._secondTimeStamp };
            })))
        };
    }

    /**
     * @returns {Promise<{xAxis: Array<Number>, yAxis: Array<Object>}>}
     * @param localeTimeStamp 
     * @param localeDate 
     * @param access 
     */
    async getTransaction(localeTimeStamp: { _primaryTimeStamp: Date, _secondTimeStamp: Date }[], localeDate: LocaleDate, access: string[]) {
        const _req = this.actionsSchema.aggregate([]);
        _req.match({ access: { $in: access }, date: { $gte: localeDate.toDate("primary"), $lte: localeDate.toDate("second") }, status: "WIDGET_PAYMENT" });
        _req.addFields({
            _stage_0: {
                $filter: {
                    input: localeTimeStamp, as: "qq", cond: {
                        $and: [{ $gte: ["$date", "$$qq._primaryTimeStamp"] },
                        { $lte: ["$date", "$$qq._secondTimeStamp"] }]
                    }
                }
            }
        });
        _req.group({ _id: "$_stage_0", q: { $sum: 1 } });
        _req.sort({ "_id._primaryTimeStamp": 1 })
        _req.group({ _id: null, xAxis: { $push: "$q" }, yAxis: { $push: { $arrayElemAt: ["$_id", 0] } } });
        _req.project({ _id: false, xAxis: true, yAxis: true });

        const _state = (await _req.exec())[0] || {
            xAxis: [],
            yAxis: []
        };

        const xAxis = new Array(12).fill(0).map((_, index) => {
            const _localeTimeStamp = localeTimeStamp[index];
            const __state = _state.yAxis.findIndex((x: { _primaryTimeStamp: Date, _secondTimeStamp: Date }) => {
                if (_localeTimeStamp._primaryTimeStamp.getTime() == x._primaryTimeStamp.getTime()
                    && _localeTimeStamp._secondTimeStamp.getTime() == x._secondTimeStamp.getTime())
                    return true;

                return false;
            });

            return __state >= 0 ? _state.xAxis[__state] : 0;
        });

        return {
            xAxis,
            yAxis: JSON.parse(JSON.stringify(localeTimeStamp.map(x => {
                return { x: x._primaryTimeStamp, y: x._secondTimeStamp };
            })))
        };
    }
}