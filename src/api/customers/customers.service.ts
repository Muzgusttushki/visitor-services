import { Injectable } from '@nestjs/common';
import { ClientProxyFactory, ClientGrpcProxy, ClientProxy } from '@nestjs/microservices';
import { Transport } from '@nestjs/common/enums/transport.enum';
import { IFiltersDTO } from './DTO/Microservices/IFiltersDTO';
import { IFilterStateDTO } from './DTO/Microservices/Echos/IFilterStateDTO';

@Injectable()
export class CustomersService {
    private readonly _paymentsService: ClientProxy;

    constructor() {
        this._paymentsService = ClientProxyFactory.create({
            transport: Transport.TCP,
            options: {
                host: '127.0.0.1',
                port: 9000
            }
        })
    }

    async filters(access: string[], pdd: number[], sdd: number[]) {
        const request = await this._paymentsService.send<IFilterStateDTO, IFiltersDTO>("payments->filters", {
            BrokenDataRange: [...pdd, ...sdd],
            AccessKeys: access
        }).toPromise();

        return request;
    }
}
