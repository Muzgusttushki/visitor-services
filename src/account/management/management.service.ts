import {BadGatewayException, Injectable} from '@nestjs/common';
import {Model} from 'mongoose';
import {AccountObject} from '../../transferDataObject/account/AccountObject';
import {InjectModel} from '@nestjs/mongoose';
import {OperationObject} from '../../transferDataObject/buyers/OperationObject';

@Injectable()
export class ManagementService {
    constructor(@InjectModel('users') private readonly usersCollection: Model<AccountObject>,
                @InjectModel('buyers') private readonly operationsCollection: Model<OperationObject>) {
    }

    async sessionVerification(username: string, role: number): Promise<AccountObject> {

        const request = await this.usersCollection
            .findOne({
                username: {$eq: username, $exists: true},
                role,
            })
            .exec()
            .then(async resolve => {
                if (!resolve) {
                    console.log(resolve)
                    throw new BadGatewayException();
                }

                return resolve;
            });

        if (request) {
            if (request.role >= 6) {
                const response = (await this.operationsCollection.aggregate([
                    {$match: {source: {$exists: true, $ne: null}}},
                    {$group: {_id: '$source'}},
                    {$group: {_id: null, sources: {$push: '$_id'}}},
                    {$project: {_id: false, sources: true}}
                ]).exec())[0];

                if (response) {
                    request.sources = [...response.sources]
                }
            }
            return request;
        }

        return null;
    }
}
