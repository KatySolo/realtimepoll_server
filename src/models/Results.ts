import { Table, Column, Model, PrimaryKey, DataType, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './User';
import { Session } from './Session';

@Table({
    createdAt: false,
    updatedAt: false
})
export class Results extends Model<Results> {

    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number

    @PrimaryKey
    @ForeignKey(() => Session)
    @Column
    sessionId: number;
 
    @BelongsTo(() => Session)
    session: Session;

    @PrimaryKey
    @ForeignKey(() => User)
    @Column
    userId: number;
 
    @BelongsTo(() => User)
    user: User;

    @Column(DataType.INTEGER)
    form: number;

    @Column(DataType.INTEGER)
    content: number;

    @Column(DataType.INTEGER)
    interest: number;

    @Column(DataType.STRING)
    comment: string;

}