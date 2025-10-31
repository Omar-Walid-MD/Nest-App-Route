import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import type { CouponDocument, CouponRepository, UserDocument } from 'src/DB';
import { FolderEnum, S3Service } from 'src/common';

@Injectable()
export class CouponService {

  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly s3Service: S3Service
  ){}

  async create(createCouponDto: CreateCouponDto, user: UserDocument, file: Express.Multer.File): Promise<CouponDocument> {

    const checkDuplicated = await this.couponRepository.findOne({
      filter: {name: createCouponDto.name, paranoid: false}
    });

    if(checkDuplicated) throw new ConflictException("Duplicated coupon name");

    if(createCouponDto.startDate <= new Date())
    {
      throw new BadRequestException("Start date cannot be in the past");
    }

    if(createCouponDto.endDate <= createCouponDto.startDate)
    {
      throw new BadRequestException("End date cannot be before start date");
    }

    const image = await this.s3Service.uploadFile({file,path:FolderEnum.Coupon});

    const [coupon] = await this.couponRepository.create({
      data: [{
        ...createCouponDto,
        image,
        createdBy: user._id
      }]
    });

    if(!coupon)
    {
      await this.s3Service.deleteFile({Key:image});
      throw new BadRequestException("Failed to create coupon");
    }

    return coupon;
  }

  findAll() {
    return `This action returns all coupon`;
  }

  findOne(id: number) {
    return `This action returns a #${id} coupon`;
  }

  update(id: number, updateCouponDto: UpdateCouponDto) {
    return `This action updates a #${id} coupon`;
  }

  remove(id: number) {
    return `This action removes a #${id} coupon`;
  }
}
