import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types, UpdateQuery } from "mongoose";
import slugify from "slugify";
import { IBrand, ICategory } from "src/common";

@Schema({timestamps:true, strictQuery:true})
export class Category implements ICategory
{
    @Prop({type:String, required:true, unique: true, minlength:2, maxlength:25})
    name: string;

    @Prop({type:String, unique: true, minlength:2, maxlength:50})
    slug: string;

    @Prop({type:String, unique: true, minlength:2, maxlength:5000})
    description:string;

    @Prop({type:String, required:true})
    image:string;

    @Prop({type:String, required:true})
    assetFolderId:string;

    @Prop([{type: Types.ObjectId,ref: "Brand"}])
    brands?: Types.ObjectId[];

    @Prop({type:Types.ObjectId, required: true, ref: "User"})
    createdBy: Types.ObjectId;

    @Prop({type:Types.ObjectId, ref: "User"})
    updatedBy: Types.ObjectId;

    @Prop({type:Date})
    freezedAt?: Date;

    @Prop({type:Date})
    restoredAt?: Date;
}

export type CategoryDocument = HydratedDocument<Category>;
const categorySchema = SchemaFactory.createForClass(Category);

categorySchema.index({expiredAt:1},{expireAfterSeconds:0});


categorySchema.pre("save",async function(next)
{
    if(this.isModified("name"))
    {
        this.slug = slugify(this.name);
    }
        
    next();
});

categorySchema.pre(["findOne","find"],async function(next)
{
    const query = this.getQuery();

    if(query.paranoid === false)
    {
        this.setQuery({...query});
    }
    else
    {
        this.setQuery({...query,freezedAt:{$exists:false}});
    }
        
    next();
});

categorySchema.pre(["updateOne","findOneAndUpdate"],async function(next)
{
    const update = this.getUpdate() as UpdateQuery<CategoryDocument>;
    const query = this.getQuery();

    if(update.name)
    {
        this.setUpdate({
            ...update,
            slug: slugify(update.name)
        });
    }

    if(query.paranoid === false)
    {
        this.setQuery({...query});
    }
    else
    {
        this.setQuery({...query,freezedAt:{$exists:false}});
    }
        
    next();
});

export const CategoryModel = MongooseModule.forFeature([{name:Category.name,schema:categorySchema}]);