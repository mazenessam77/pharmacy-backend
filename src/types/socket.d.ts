import { IUser } from './index';

declare module 'socket.io' {
  interface Socket {
    user?: IUser & { _id: any };
  }
}
