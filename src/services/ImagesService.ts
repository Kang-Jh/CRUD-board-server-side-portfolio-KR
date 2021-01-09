import { ImagesServiceInterface } from '../types/Services/ImagesService';
import { v4 as uuidv4 } from 'uuid';
import { getFileExtension } from '../utils';

const IMAGES_BUCKET = <string>process.env.IMAGES_BUCKET;
const CLOUDFRONT_IMAGES_URI = <string>process.env.CLOUDFRONT_IMAGES_URI;
export default class ImagesService implements ImagesServiceInterface {
  s3: AWS.S3;

  constructor(s3: AWS.S3) {
    this.s3 = s3;
  }

  async uploadImage(imageFile: Express.Multer.File, prefixKey: string) {
    const id = uuidv4();
    const ext = getFileExtension(imageFile.originalname);
    const key = ext ? `${prefixKey}/${id}.${ext}` : `${prefixKey}/${id}`;

    await this.s3
      .upload({
        Bucket: IMAGES_BUCKET,
        Key: key,
        Body: imageFile.buffer,
        ContentType: imageFile.mimetype,
        ACL: 'public-read',
      })
      .promise();

    return {
      key,
      src: `${CLOUDFRONT_IMAGES_URI}/${key}`,
      filename: imageFile.originalname,
      mimetype: imageFile.mimetype,
      size: imageFile.size,
    };
  }
}
