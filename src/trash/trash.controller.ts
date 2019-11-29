import {Controller, Get} from '@nestjs/common';
import {TrashService} from "./trash.service";

@Controller('trash')
export class TrashController {
    constructor(private readonly  trash: TrashService) {}

    @Get('topconcerts')
    async topconcerts() {
        return await this.trash.analysis([
            'http://topconcerts.ru',
            'https://topconcerts.ru'
        ]);
    }

    @Get('addresses')
    async getAddress() {
        return await this.trash.addresses()
    }
}
