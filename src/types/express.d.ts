import { IUser } from './index';
import type { DeliveryDocument } from '../models/Delivery';

declare global {
  namespace Express {
    interface Request {
      user?: IUser & { _id: any };
      // Populated by authorizeDelivery after ownership checks pass.
      delivery?: DeliveryDocument;
    }
  }
}
