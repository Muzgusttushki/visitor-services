import { Request } from "express";
import { IUser } from "src/account/types/IUser";

export interface IUserRequest extends Request {
    user: IUser
}