import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, ParseFilePipe, UsePipes, ValidationPipe, Query, Inject } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductParamDto, UpdateProductAttachmentDto, UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Auth, cloudFileUpload, fileValidation, GetAllDto, GetAllResponse, IProduct, IResponse, StorageEnum, successResponse, User } from 'src/common';
import { endpoint } from './authorization';
import type { ProductDocument, UserDocument } from 'src/DB';
import { ProductResponse } from './entities/product.entity';
import { RedisCacheInterceptor } from 'src/common/interceptors/cache.interceptor';


@UsePipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true}))
@UseInterceptors(RedisCacheInterceptor)
@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService
  ) {}

  @UseInterceptors(FilesInterceptor("attachments",5,cloudFileUpload({validation:fileValidation.image,storageApproach:StorageEnum.disk})))
  @Auth(endpoint.create)
  @Post()
  async create(
    @UploadedFiles(ParseFilePipe) files: Express.Multer.File[],
    @User() user: UserDocument,
    @Body() createProductDto: CreateProductDto
  ): Promise<IResponse<ProductResponse>> {
    const product = await this.productService.create(createProductDto, files, user);
    return successResponse<ProductResponse>({status:201,data:{product}});
  }

  @Auth(endpoint.create)
  @Patch(':productId')
  async update(@Param() params: ProductParamDto, @Body() updateProductDto: UpdateProductDto, @User() user): Promise<IResponse<ProductResponse>> {
    const product = await this.productService.update(params.productId, updateProductDto, user);
    return successResponse<ProductResponse>({data:{product}});

  }

  @Auth(endpoint.create)
  @Patch(':productId/attachment')
  async updateAttachment(
    @Param() params: ProductParamDto,
    @Body() updateProductDto: UpdateProductAttachmentDto,
    @User() user,
    @UploadedFiles(new ParseFilePipe({fileIsRequired:false})) files?: Express.Multer.File[]
  ): Promise<IResponse<ProductResponse>> {
    const product = await this.productService.updateAttachment(params.productId, updateProductDto, user, files);
    return successResponse<ProductResponse>({data:{product}});

  }

  
  @Get(":productId")
  async findOne(
    @Param() params: ProductParamDto
  ): Promise<IResponse<ProductResponse>>
  {
    const product = await this.productService.findOne(params.productId);
    return successResponse<ProductResponse>({data:{product}});
  }

  @Auth(endpoint.create)
  @Get(":productId/archive")
  async findOneArchive(
    @Param() params: ProductParamDto
  ): Promise<IResponse<ProductResponse>>
  {
    const product = await this.productService.findOne(params.productId,true);
    return successResponse<ProductResponse>({data:{product}});
  }

  @Get()
  async findAll(
    @Query() query: GetAllDto
  ): Promise<IResponse<GetAllResponse<IProduct>>>
  {
    const result = await this.productService.findAll(query);
    return successResponse<GetAllResponse<IProduct>>({data:{result}});
  }

  @Auth(endpoint.create)
  @Get("/archive")
  async findAllArchives(
    @Query() query: GetAllDto
  ): Promise<IResponse<GetAllResponse<IProduct>>>
  {
    const result = await this.productService.findAll(query,true);
    return successResponse<GetAllResponse<IProduct>>({data:{result}});
  }

  
  @Auth(endpoint.create)
  @Delete(':productId/freeze')
  async freeze(
    @Param() params: ProductParamDto,
    @User() user: UserDocument
  ): Promise<IResponse> {
    await this.productService.freeze(params.productId, user);
    return successResponse();
  }

  @Auth(endpoint.create)
  @Patch(':productId/restore')
  async restore(
    @Param() params: ProductParamDto,
    @User() user: UserDocument
  ): Promise<IResponse<ProductResponse>> {
    const product = await this.productService.restore(params.productId, user);
    return successResponse<ProductResponse>({data:{product}});
  }

  @Auth(endpoint.create)
  @Delete(':productId')
  async remove(
    @Param() params: ProductParamDto,
    @User() user: UserDocument
  ): Promise<IResponse> {
    await this.productService.remove(params.productId, user);
    return successResponse();
  }

  @Auth(endpoint.create)
  @Patch(':productId/add-to-wishlist')
  async addToWishlist(
    @Param() params: ProductParamDto,
    @User() user: UserDocument
  ): Promise<IResponse<ProductResponse>> {
    const product = await this.productService.addToWishlist(params.productId, user);
    return successResponse<ProductResponse>({data:{product}});
  }

  @Auth(endpoint.create)
  @Patch(':productId/remove-from-wishlist')
  async removeFromWishlist(
    @Param() params: ProductParamDto,
    @User() user: UserDocument
  ): Promise<IResponse> {
    await this.productService.removeFromWishlist(params.productId, user);
    return successResponse();
  }
}
