import { CreateOptions, DeleteResult, FlattenMaps, HydratedDocument, Model, MongooseUpdateQueryOptions, PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery, Types, UpdateQuery, UpdateWriteOpResult } from "mongoose";

export type Lean<T> = FlattenMaps<T>;

export abstract class DatabaseRepository<TRawDocument, TDocument=HydratedDocument<TRawDocument>> {
    protected constructor(protected model: Model<TDocument>) { }

    async create({
        data,
        options
    }: {
        data: Partial<TRawDocument>[];
        options?: CreateOptions | undefined;
    }): Promise<TDocument[]> {
        return (await this.model.create(data, options)) || [];
    }

    async insertMany({
        data,
    }: {
        data: Partial<TDocument>[];
    }): Promise<TDocument[]> {
        return await this.model.insertMany(data) as TDocument[];
    }

    async findOne({
        filter, select, options
    }: {
        filter: RootFilterQuery<TRawDocument>;
        select?: ProjectionType<TRawDocument> | null;
        options?: QueryOptions<TDocument> | null;
    }): Promise<Lean<TDocument> | TDocument | null> {
        const doc = this.model.findOne(filter).select(select || "");

        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[]);
        }

        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }

    async find({
        filter, select, options
    }: {
        filter: RootFilterQuery<TRawDocument>;
        select?: ProjectionType<TRawDocument> | undefined;
        options?: QueryOptions<TDocument> | undefined;
    }): Promise<Lean<TDocument>[] | TDocument[] | []> {
        const doc = this.model.find(filter || {}).select(select || "");

        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[]);
        }

        if (options?.skip) {
            doc.skip(options.skip);
        }

        if (options?.limit) {
            doc.limit(options.limit);
        }

        if (options?.lean) {
            doc.lean(options.lean);
        }

        return await doc.exec();
    }

    async paginate({
        filter = {},
        select,
        options = {},
        page = "all",
        size = 5
    }: {
        filter: RootFilterQuery<TRawDocument>;
        select?: ProjectionType<TRawDocument> | undefined;
        options?: QueryOptions<TDocument> | undefined;
        page?: number | "all";
        size?: number;
    }): Promise<{
        docsCount?: number;
        limit?: number;
        pages?: number;
        currentPage?: number|undefined;
        result: TDocument[] | Lean<TDocument>[];
    }> {
        let docsCount: number | undefined = undefined;
        let pages: number | undefined = undefined;

        if (page !== "all") {
            page = Math.floor(page || page < 1 ? 1 : page);
            options.limit = Math.floor((size < 1 || !size) ? 5 : size);
            options.skip = (page - 1) * options.limit;

            docsCount = await this.model.countDocuments(filter);
            pages = Math.ceil(docsCount / options.limit);
        }

        const result = await this.find({ filter, select, options });
        return { docsCount, limit: options.limit, pages, currentPage: page !== "all" ? page : undefined, result };
    }

    async findById({
        id, select, options
    }: {
        id: Types.ObjectId;
        select?: ProjectionType<TRawDocument> | null;
        options?: QueryOptions<TDocument> | null;
    }): Promise<Lean<TDocument> | TDocument | null> {
        const doc = this.model.findById(id).select(select || "");

        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[]);
        }

        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }

    async updateOne({
        filter,
        update,
        options

    }: {
        filter: RootFilterQuery<TRawDocument>;
        update: UpdateQuery<TDocument>;
        options?: MongooseUpdateQueryOptions<TDocument> | null;

    }): Promise<UpdateWriteOpResult> {

        if (Array.isArray(update)) {
            return await this.model.updateOne(filter,
                [...update, { $set: { __v: { $add: ["$__v", 1] } } }],
                options);
        }

        return await this.model.updateOne(filter,
            { ...update, $inc: { __v: 1 } },
            options);
    }

    async findByIdAndUpdate({
        id,
        update,
        options

    }: {
        id: Types.ObjectId;
        update: UpdateQuery<TDocument>;
        options?: QueryOptions<TDocument> | null;

    }): Promise<TDocument | Lean<TDocument> | null> {
        return await this.model.findByIdAndUpdate(id,
            { ...update, $inc: { __v: 1 } },
            options);
    }

    async findOneAndUpdate({
        filter,
        update,
        options={new:true}

    }: {
        filter: RootFilterQuery<TRawDocument>;
        update: UpdateQuery<TDocument>;
        options?: QueryOptions<TDocument> | null;

    }): Promise<TDocument | Lean<TDocument> | null> {

        if (Array.isArray(update)) {
            return await this.model.findOneAndUpdate(filter,
                [...update, { $set: { __v: { $add: ["$__v", 1] } } }],
                options);
        }
        
        return await this.model.findOneAndUpdate(filter,
            { ...update, $inc: { __v: 1 } },
            options);
    }

    async deleteOne({
        filter
    }: {
        filter: RootFilterQuery<TRawDocument>;

    }): Promise<DeleteResult> {
        return await this.model.deleteOne(filter);
    }

    async findOneAndDelete({
        filter
    }: {
        filter: RootFilterQuery<TRawDocument>;

    }): Promise<TDocument | null> {
        return await this.model.findOneAndDelete(filter);
    }

    async deleteMany({
        filter
    }: {
        filter: RootFilterQuery<TRawDocument>;

    }): Promise<DeleteResult> {
        return await this.model.deleteMany(filter);
    }

}