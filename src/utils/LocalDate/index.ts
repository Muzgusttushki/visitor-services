import { tz } from 'moment-timezone';

export class LocaleDate {
    private readonly second: Date;
    private readonly primary: Date;
    constructor(formate: number[]) {
        this.primary = new Date(Date.UTC(formate[0], formate[1], formate[2], 0, 0, 0, 0));
        this.second = new Date(Date.UTC(formate[3], formate[4], formate[5], 23, 59, 59, 999));
    }


    toDate(code: "primary" | "second"): Date {
        return tz(this[code], "Europe/Moscow").toDate();
    }
}