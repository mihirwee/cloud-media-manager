import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { GoogleAuth } from 'google-auth-library';
import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class StorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.getOrThrow<string>('GCP_BUCKET_NAME');

    const auth = new GoogleAuth({
      keyFile: this.configService.getOrThrow<string>('GCP_KEY_FILE'),
    });

    this.storage = new Storage({
      projectId: this.configService.getOrThrow<string>('GCP_PROJECT_ID'),
      authClient: auth,
    });
  }

  async uploadFile(file: Express.Multer.File) {
    const filename = `${randomUUID()}${extname(file.originalname)}`;
    const destination = `uploads/${filename}`;

    const bucket = this.storage.bucket(this.bucketName);
    const cloudFile = bucket.file(destination);

    await cloudFile.save(file.buffer, {
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    return {
      message: 'File uploaded successfully',
      bucket: this.bucketName,
      fileName: destination,
      contentType: file.mimetype,
      size: file.size,
    };
  }
}
