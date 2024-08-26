import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const generateToudId = () => {
  const uuid = uuidv4(); 
  const hash = crypto.createHash('sha256').update(uuid).digest('hex');
  return hash.substring(0, 8)
}
