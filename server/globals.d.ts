import { IStorage } from './storage';

declare global {
  namespace NodeJS {
    interface Global {
      storage: IStorage;
    }
  }
}