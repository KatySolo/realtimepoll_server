import { Table, Column, Model, PrimaryKey, DataType, AutoIncrement, HasMany, Unique } from 'sequelize-typescript';
import { Session } from './Session';
import { Results } from './Results';

@Table({
	createdAt: false,
	updatedAt: false
})
export class User extends Model<User> {

    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @Unique
    @Column(DataType.STRING)
    name: string;

    @HasMany(() => Session)
    sessions: Session[];

    @HasMany(() => Results)
    results: Results[];
}
