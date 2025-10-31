import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductAttachmentDto, UpdateProductDto } from './dto/update-product.dto';
import { BrandRepository, CategoryDocument, CategoryRepository, ProductDocument, type UserDocument, UserRepository } from 'src/DB';
import { ProductRepository } from 'src/DB/repository/product.repository';
import { FolderEnum, GetAllDto, S3Service } from 'src/common';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { Lean } from 'src/DB/repository/database.repository';

@Injectable()
export class ProductService {

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly brandRepository: BrandRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly userRepository: UserRepository,
    private readonly s3Service: S3Service
  ) {}

  async create(createProductDto: CreateProductDto, files: Express.Multer.File[], user: UserDocument): Promise<ProductDocument>
  {
    const {name, description, originalPrice, discountPercent, stock} = createProductDto;
    const category = await this.categoryRepository.findOne({filter:{_id:createProductDto.category}});
    if(!category)
    {
      throw new NotFoundException("Failed to find matching category");
    }

    const brand = await this.brandRepository.findOne({filter:{_id:createProductDto.brand}});
    if(!brand)
    {
      throw new NotFoundException("Failed to find matching brand");
    }

    let assetFolderId = randomUUID();

    const images = await this.s3Service.uploadFiles({
      files,
      path:`${FolderEnum.Category}/${createProductDto.category}/${FolderEnum.Product}/${assetFolderId}`
    });

    const [product] = await this.productRepository.create({
      data: [{
        name,
        description,
        originalPrice,
        discountPercent,
        salePrice: Number((originalPrice * (1 - (discountPercent ?? 0)/100)).toFixed(2)),
        stock,
        category: category._id,
        brand: brand._id,
        assetFolderId,
        images,
        createdBy: user._id
      }]
    });

    if(!product)
    {
      throw new BadRequestException("Failed to create this product");
    }
    
    return product;
  }

  async update(productId: Types.ObjectId, updateProductDto: UpdateProductDto, user: UserDocument): Promise<ProductDocument>
  {
    const product = await this.productRepository.findOne({
      filter: {_id: productId}
    });

    if(!product) throw new NotFoundException("Failed to find matching product");

    if(updateProductDto.category)
    {
      const category = await this.categoryRepository.findOne({filter:{_id:updateProductDto.category}});
      if(!category)
      {
        throw new NotFoundException("Failed to find matching category");
      }
    }

    if(updateProductDto.brand)
    {
      const brand = await this.brandRepository.findOne({filter:{_id:updateProductDto.brand}});
      if(!brand)
      {
        throw new NotFoundException("Failed to find matching brand");
      }
    }

    let salePrice = product.salePrice;
    if(updateProductDto.originalPrice || updateProductDto.discountPercent)
    {
      const originalPrice = updateProductDto.originalPrice ?? product.originalPrice;
      const discountPercent = updateProductDto.discountPercent ?? product.discountPercent;
      const finalPrice = Number((originalPrice * (1 - discountPercent/100)).toFixed(2));
      salePrice = finalPrice > 0 ? finalPrice : 1;
    }

    const updatedProduct = this.productRepository.findOneAndUpdate({
      filter: {_id: productId},
      update: {
        ...updateProductDto,
        salePrice,
        updatedBy: user.id
      }
    });


    if(!updatedProduct)
    {
      throw new BadRequestException("Failed to update this product");
    }
    
    return updatedProduct as unknown as ProductDocument;
  }

  async updateAttachment(productId: Types.ObjectId, updateProductAttachmentDto: UpdateProductAttachmentDto, user: UserDocument, files?: Express.Multer.File[]): Promise<ProductDocument>
  {
    const product = await this.productRepository.findOne({
      filter: {_id: productId},
      options: {
        populate: [
          {path:"category"}
        ]
      }
    });

    if(!product) throw new NotFoundException("Failed to find matching product");

    let attachments: string[] = [];
    if(files?.length)
    {
      attachments = await this.s3Service.uploadFiles({files,path:`${FolderEnum.Category}/${(product.category as unknown as CategoryDocument).assetFolderId}/${FolderEnum.Product}/${product.assetFolderId}`});
    }

    const removedAttachments = [...new Set(updateProductAttachmentDto.removedAttachments ?? [])];


    const updatedProduct = this.productRepository.findOneAndUpdate({
      filter: {_id: productId},
      update: [
        {
          $set: {
            updatedBy: user._id,
            images: {
              $setUnion:[
                {$setDifference:[
                  "$images", removedAttachments
                ]},
                attachments
              ]
            }
          }
        }
      ]
    });


    if(!updatedProduct)
    {
      await this.s3Service.deleteFiles({urls:attachments});
      throw new BadRequestException("Failed to update this product");
    }
    
    return updatedProduct as unknown as ProductDocument;
  }

  async findAll(data: GetAllDto, archive: boolean=false): Promise<{
        docsCount?: number;
        limit?: number;
        pages?: number;
        currentPage?: number|undefined;
        result: ProductDocument[] | Lean<ProductDocument>[];
    }> {
    const {page,size,search} = data;
    const result = await this.productRepository.paginate({
      filter: {
        ...(search?{
          $or: [
            {name:{$regex:search, $options: "i"}},
            {slug:{$regex:search, $options: "i"}},
            {slogan:{$regex:search, $options: "i"}}
          ]
        }:{}),
        ...(archive?{paranoid:false,freezedAt:{$exists:true}}:{})
      },
      page,
      size
    })

    return result;
  }

  async findOne(productId: Types.ObjectId, archive: boolean=false): Promise<ProductDocument | Lean<ProductDocument>> {
    const product = await this.productRepository.findOne({
      filter: {
        _id: productId,
        ...(archive?{paranoid:false,freezedAt:{$exists:true}}:{})
      }
    });

    if(!product) throw new NotFoundException("Failed to find matching product");

    return product;
  }

  async freeze(productId: Types.ObjectId, user: UserDocument): Promise<string>
  {
    
    const product = await this.productRepository.findOneAndUpdate({
      filter: {_id: productId},
      update: {
        freezedAt: new Date(),
        updatedBy: user._id,
        $unset: {
          restoredAt: true
        }
      },
      options:{new:false}
    });

    if(!product)
    {
      throw new NotFoundException("Failed to find matching product");
    }

    return "Done";
  }

  async restore(productId: Types.ObjectId, user: UserDocument): Promise<ProductDocument | Lean<ProductDocument>>
  {
    
    const product = await this.productRepository.findOneAndUpdate({
      filter: {_id: productId, paranoid: false, freezedAt: {$exists:true}},
      update: {
        restoredAt: new Date(),
        updatedBy: user._id,
        $unset: {
          freezedAt: true
        }
      }
    });

    if(!product)
    {
      throw new NotFoundException("Failed to find matching product");
    }

    return product;
  }

  async remove(productId: Types.ObjectId, user: UserDocument): Promise<string>
  {
    
    const product = await this.productRepository.findOneAndDelete({
      filter: {_id: productId, paranoid: false, freezedAt: {$exists:true}}
    });

    if(!product)
    {
      throw new NotFoundException("Failed to find matching product");
    }

    await this.s3Service.deleteFiles({urls:product.images});

    return "Done";
  }

  async addToWishlist(productId: Types.ObjectId, user: UserDocument): Promise<ProductDocument | Lean<ProductDocument>>
  {
    
    const product = await this.productRepository.findOne({
      filter: {_id: productId}
    });

    if(!product)
    {
      throw new NotFoundException("Failed to find matching product");
    }

    await this.userRepository.updateOne({
      filter: {_id: user._id},
      update: {
        $addToSet: {
          wishlist: product._id
        }
      }
    })

    return product;
  }

  async removeFromWishlist(productId: Types.ObjectId, user: UserDocument): Promise<string>
  {

    await this.userRepository.updateOne({
      filter: {_id: user._id},
      update: {
        $pull: {
          wishlist: Types.ObjectId.createFromHexString(productId as unknown as string)
        }
      }
    })

    return "Done";
  }

}
