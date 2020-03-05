import {Table, Column, Model, PrimaryKey, DataType, AutoIncrement, BelongsTo, HasMany, ForeignKey} from 'sequelize-typescript';
import {User} from './User'
import { Results } from './Results';

@Table({
    createdAt: false,
    updatedAt: false
})
export class Session extends Model<Session> {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number

    @Column(DataType.STRING)
    title: string;

    @ForeignKey(() => User)
    @Column
    lectorId: number;

    @BelongsTo(() => User)
    lector: User;

    @Column(DataType.DATE)
    start: Date;

    @Column(DataType.DATE)
    finish: Date;

    @HasMany(() => Results)
    results: Results[];
}