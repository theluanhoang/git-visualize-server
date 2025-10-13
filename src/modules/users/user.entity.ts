import { Column, Entity } from 'typeorm';
import { CommonEntity } from '../../shared/entities/common.entity';

export type UserRole = 'USER' | 'ADMIN';

@Entity('user')
export class User extends CommonEntity {
  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 10, default: 'USER' })
  role: UserRole;
}


