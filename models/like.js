import Model from './model.js';
import UserModel from './user.js';
import Repository from '../models/repository.js';

export default class Like extends Model {
    constructor()
    {
        super();
        this.addField('OwnerId', 'string');
        this.addField('PhotoId', 'string');
    }
}