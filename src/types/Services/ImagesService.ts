import { Image } from '../Data';

export interface ImagesServiceInterface {
  s3: AWS.S3;

  uploadImage(
    imageFile: Express.Multer.File,
    prefixKey: string
  ): Promise<Image>;
}
