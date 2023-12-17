import Model from './model.js';
import UserModel from './user.js';
import Repository from '../models/repository.js';
import LikeModel from './like.js';

export default class Photo extends Model {
    constructor()
    {
        super();
        this.addField('OwnerId', 'string');
        this.addField('Title', 'string');        
        this.addField('Description', 'string');
        this.addField('Image', 'asset');
        this.addField('Date','integer');
        this.addField('Shared','boolean');

        this.setKey("Title");
    }

    bindExtraData(instance) {
        instance = super.bindExtraData(instance);
        const usersRepository = new Repository(new UserModel());
        const owner = usersRepository.get(instance.OwnerId);
        const likesRepository = new Repository(new LikeModel());
        const likes = likesRepository.getAll().filter((like) => like.PhotoId === instance.Id);
        for (const like of likes) {
            const user = usersRepository.get(like.OwnerId);
            like.Name = user.Name;
            like.PhotoId;
        }

        instance.OwnerName = owner.Name;
        instance.OwnerAvatar = owner.Avatar;
        instance.Likes = likes;
        return instance;
    }
}