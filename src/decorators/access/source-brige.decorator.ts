import { Request, createParamDecorator, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AccountObject } from '../../transferDataObject/account/AccountObject';
import { DateTimeRange } from '../../transferDataObject/types/DateTimeRange';

export const SourceBrige = createParamDecorator(async (_, req: Request) => {
    const user = req['user'] as AccountObject;
    if (!user) { throw new ForbiddenException() }

    const sources = req.body['sources'] as string[],
        timeInterval = req.body['timeInterval'] as DateTimeRange
    if (!(sources && timeInterval)) { throw new BadRequestException() }

    const prepareSources = { source: {}, date: {} };

    if (!(timeInterval.start && timeInterval.end)) {
        throw new BadRequestException()
    }

    const rangeDateTime = [
        new Date(Date.parse(timeInterval.start)),
        new Date(Date.parse(timeInterval.end))
    ]

    rangeDateTime[0].setUTCDate(rangeDateTime[0].getUTCDate() + 1)
    rangeDateTime[0].setUTCHours(0, 0, 0, 0);
    rangeDateTime[1].setUTCHours(23, 59, 59);


    if (rangeDateTime[0] > rangeDateTime[1]) {
        throw new BadRequestException()
    }

    prepareSources.date = {
        $lte: new Date(rangeDateTime[1]),
        $gte: new Date(rangeDateTime[0])
    }

    if (sources.length) {
        if (
            user.role < 6 &&
            !sources.every(resolve => user.sources.includes(resolve))
        ) {
            throw new ForbiddenException();
        }

        prepareSources.source = { $in: sources };
    } else {
        prepareSources.source = { $in: user.sources };
    }

    return prepareSources
});