import Controller from './Controller.js';
import LikesModel from '../models/like.js';
import Authorizations from '../authorizations.js';
import TokensManager from '../tokensManager.js';
import Repository from '../models/repository.js';

export default class LikesController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new LikesModel()), Authorizations.admin);
    }

    add(data)
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
        if (this.repository.findByFilter((like) => like.PhotoId === data.PhotoId && like.OwnerId === token.User.Id).length !== 0) {
            this.HttpContext.response.conflict("The photo was already liked");
            return;
        }

        this.repository.add({PhotoId: data.PhotoId, OwnerId: token.User.Id });
    }

    remove(data)
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
        const like = this.repository.findByFilter(`PhotoId=${data.PhotoId},userId=${token.User.Id}`);
        if (like === null) {
            this.HttpContext.response.badRequest("Not the owner of this like");
            return;
        }
        this.repository.remove(like.Id);
    }
}