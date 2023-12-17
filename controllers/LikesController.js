import Controller from './Controller.js';
import LikesModel from '../models/like.js';
import Authorizations from '../authorizations.js';
import TokensManager from '../tokensManager.js';

export default class LikesController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new LikesModel()), Authorizations.admin);
    }

    add(photoId)
    {
        if (!Authorizations.writeGranted(this.HttpContext, Authorizations.user())) {
            this.HttpContext.response.forbidden("Not the right permissions for this");
            return;
        }
        if (this.HttpContext.req.headers["authorization"] === undefined) {
            this.HttpContext.response.unAuthorized("Invalid token");
            return;
        }
        let token = this.HttpContext.req.headers["authorization"].replace('Bearer ', '');
        token = TokensManager.find(token);
        if (!token) {
            this.HttpContext.response.unAuthorized("Invalid token");
            return;
        }
        if (this.repository.findByFilter(`PhotoId=${photoId},userId=${token.User.Id}`) === null) {
            this.HttpContext.response.conflict("The photo was already liked");
            return;
        }

        this.repository.add({PhotoId: photoId, OwnerId: token.User.Id });
    }

    remove(likeId)
    {
        if (!Authorizations.writeGranted(this.HttpContext, Authorizations.user()))
        {
            this.HttpContext.response.forbidden("Not the right permissions for this");
            return;
        }
        token = TokensManager.find(token);
        if (!token) {
            this.HttpContext.response.unAuthorized("Invalid token");
            return;
        }
        if (this.repository.find(likeId).OwnerId !== token.User.Id) {
            this.HttpContext.responsel.badRequest("Not the owner of this like");
        }
        
        this.repository.remove(likeId);
    }
}