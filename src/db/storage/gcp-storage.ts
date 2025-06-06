import { Storage, UploadOptions } from '@google-cloud/storage';

type Metadata = UploadOptions['metadata'];
type StorageType = InstanceType<typeof Storage>
let storage: StorageType;
let bucket: ReturnType<typeof storage.bucket>;

function init(){
  if(storage && bucket){
    return {
      storage,
      bucket,
    };
  }
  const mstorage = new Storage({
    keyFilename: process.env.AUDIO_STORAGE_GOOGLE_AUTH
  });
  const mbucketName = 'vagent';
  const mbucket = mstorage.bucket(mbucketName);
  bucket = mbucket;
  storage = mstorage;
  return {
    storage: mstorage,
    bucket: mbucket,
  }
}

export async function uploadFile(filePath: string, destination: string, metadata?: Metadata): Promise<void> {
  init();
  await bucket.upload(filePath, { destination, metadata });
}

export async function downloadFile(srcFilename: string, destFilename: string): Promise<void> {
  init();
  const options = { destination: destFilename };
  await bucket.file(srcFilename).download(options);
}

export async function deleteFile(filename: string): Promise<void> {
  init();
  await bucket.file(filename).delete();
}

export async function listFiles(prefix = ''): Promise<string[]> {
  init();
  const [files] = await bucket.getFiles({ prefix });
  return files.map(file => file.name);
}

export async function exists(filename: string): Promise<boolean> {
  init();
  const [exists] = await bucket.file(filename).exists();
  return exists;
}
