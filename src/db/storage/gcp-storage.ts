import { Storage, UploadOptions } from '@google-cloud/storage';

import _trimStart from 'lodash/trimStart';

type Metadata = UploadOptions['metadata'];
type StorageType = InstanceType<typeof Storage>
let storage: StorageType;

const mbucketName = 'vagent';

function bucket(name = mbucketName) {
  return storage.bucket(name);
}

function init(){
  if(storage){
    return {
      storage,
      // bucket,
    };
  }
  const mstorage = new Storage({
    keyFilename: process.env.AUDIO_STORAGE_GOOGLE_AUTH
  });
  storage = mstorage;
  return {
    storage: mstorage,
  }
}

export async function uploadFile(filePath: string, destination: string, metadata?: Metadata): Promise<void> {
  init();
  destination = _trimStart(destination, '/');
  await bucket().upload(filePath, { destination, metadata });
}

export async function downloadFile(srcFilename: string, destFilename: string): Promise<void> {
  init();
  destFilename = _trimStart(destFilename, '/');
  const options = { destination: destFilename };
  await bucket().file(srcFilename).download(options);
}

export async function deleteFile(filename: string): Promise<void> {
  init();
  filename = _trimStart(filename, '/');
  await bucket().file(filename).delete();
}

export async function listFiles(prefix = ''): Promise<string[]> {
  init();
  prefix = _trimStart(prefix, '/');
  const [files] = await bucket().getFiles({ prefix });
  return files.map(file => file.name);
}

export async function exists(filename: string): Promise<boolean> {
  init();
  filename = _trimStart(filename, '/');
  const [exists] = await bucket().file(filename).exists();
  return exists;
}
