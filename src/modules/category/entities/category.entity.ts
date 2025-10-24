import { ICategory } from "src/common";
import { Lean } from "src/DB/repository/database.repository";

export class CategoryResponse {
    category: ICategory
}

export class GetAllResponse
{
    result: {
        docsCount?: number;
        limit?: number;
        pages?: number;
        currentPage?: number|undefined;
        result: ICategory[] | Lean<ICategory>[];
    }
}