import { IBrand } from "src/common";
import { Lean } from "src/DB/repository/database.repository";

export class BrandResponse {
    brand: IBrand
}

export class GetAllResponse
{
    result: {
        docsCount?: number;
        limit?: number;
        pages?: number;
        currentPage?: number|undefined;
        result: IBrand[] | Lean<IBrand>[];
    }
}