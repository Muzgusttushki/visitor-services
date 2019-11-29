import { IsDefined, IsString, IsNumber } from "class-validator";

export class PaymentsFiltersDataObject {
    /**
     * @description Производит выборку по параметру money(минимальная, максимальная цена пользователя)
     */
    //@Length(2, 2)
    @IsDefined()
    @IsNumber({}, { each: true })
    money: number[]

    /**
     * @description Выборка по средней стоимости покупателя (минимальная, максимальная цена операции)
     */
    //@Length(2, 2)
    @IsDefined()
    @IsNumber({}, { each: true })
    averageMoney: number[]

    /**
     * @description выборка по количеству билетов в рамкаъ покуп ателя
     */
    //@Length(2, 2)


    @IsDefined()
    @IsNumber({}, { each: true })
    ticketInTransaction: number[]

    @IsDefined()
    @IsNumber({}, {each: true})
    transactions: number[]

    /**
     * @description город совершения операции, транзакции (пустое поле - отображает все доступные)
     */
    @IsDefined()
    @IsString({ each: true })
    city: string[]

    /**
     * @description событие (работает только в транзакциях) фильтрация по списку покупок
     */
    @IsDefined()
    @IsString({ each: true })
    event: string[]

    /**
     * @description умный поиск (совершает поиск по нескольким парамеметрам, часть обучения AI)
     */
    @IsString()
    search: string;

    @IsNumber()
    @IsDefined()
    offset: number;
}
