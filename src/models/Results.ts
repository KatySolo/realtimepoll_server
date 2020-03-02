import {Table, Column, Model, PrimaryKey, DataType, AutoIncrement} from 'sequelize-typescript';

@Table
class Results extends Model<Results> {

    @Column(DataType.INTEGER)
    @PrimaryKey
    @AutoIncrement
    id: number

    @Column(DataType.INTEGER)
    sessionId: number;

    @Column(DataType.INTEGER)
    userId: number;

    @Column(DataType.INTEGER)
    form: number;

    @Column(DataType.INTEGER)
    content: number;

    @Column(DataType.INTEGER)
    interest: number;

    @Column(DataType.STRING)
    comment: string;

}