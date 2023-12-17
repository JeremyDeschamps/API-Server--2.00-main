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
        this.HttpContext.response.ok();
    }

    remove(data)
    {
        if (!Authorizations.writeGranted(this.HttpContext, Authorizations.user()))
        {
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
        const like = this.repository.findByFilter((like) => like.PhotoId === data.PhotoId && like.OwnerId === token.User.Id);
        if (like.length === 0) {
            this.HttpContext.response.badRequest("This photo was not liked");
            return;
        }
        this.repository.remove(like[0].Id);
        this.HttpContext.response.ok();
    }
}