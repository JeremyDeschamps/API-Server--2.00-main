import Model from './model.js';
import UserModel from './user.js';
import Repository from '../models/repository.js';

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
        this.addField('Likes','array');
        this.setKey("Title");
    }

    bindExtraData(instance) {
        instance = super.bindExtraData(instance);
        const usersRepository = new Repository(new UserModel());
        const owner = usersRepository.get(instance.OwnerId);
        const newLikes = [];
        for (const id of instance.Likes) {
            const user = usersRepository.get(id);
            const newLike = {
                Name: user.Name,
                Id: id,
            };
            newLike.Name = user.Name;
            newLike.PhotoId;
            newLikes.push(newLike);
        }
        instance.Likes = newLikes;
        instance.OwnerName = owner.Name;
        instance.OwnerAvatar = owner.Avatar;
        return instance;
    }
}