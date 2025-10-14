import { Injectable } from '@nestjs/common';

@Injectable()
export class CategoryService {


    categories()
    {
        return [
            {id:"1",name:"fashion"}
        ]
    }
}
