import { User } from 'src/modules/users/entities/user.entity';
import { Image } from './image.entity';

export type ImageDetails = Image & { author: User };
