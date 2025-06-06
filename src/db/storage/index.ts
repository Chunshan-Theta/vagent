import * as gcpStorage from './gcp-storage';
import * as localStorage from './local-storage';

export function getStorage(){
  if(process.env.AUDIO_STORAGE_GOOGLE_AUTH){
    return { type: 'vstorage', ...gcpStorage };
  }
  return { type: 'file', ...localStorage };
}