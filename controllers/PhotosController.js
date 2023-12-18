import Authorizations from '../authorizations.js';
import Repository from '../models/repository.js';
import PhotoModel from '../models/photo.js';
import Controller from './Controller.js';
import TokensManager from '../tokensManager.js';

export default class Photos extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new PhotoModel()), Authorizations.user());
    }

    get(id) {
        if (Authorizations.readGranted(this.HttpContext, this.authorizations)) {
            if (this.repository != null) {
                if (id !== undefined) {
                    let data = this.repository.get(id);
                    if (data != null)
                        this.HttpContext.response.JSON(data);
                    else
                        this.HttpContext.response.notFound("Ressource not found.");
                } else {
                    
                    const photos = this.repository.getAll(this.HttpContext.path.params);

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
                    this.HttpContext.response.JSON(photos.filter((photo) => photo.Shared || token.User.Id === photo.OwnerId), this.repository.ETag, false, this.authorizations);
                }
            } else
                this.HttpContext.response.notImplemented();
        } else
            this.HttpContext.response.unAuthorized("Unauthorized access");
    }
    addlike(data)
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
        const photo = this.repository.findByField("Id", data.PhotoId);
        if (photo === null) {
            this.HttpContext.response.notFound("Photo not found");
            return;
        }
        if (photo.Likes.some(id => id === token.User.Id)) {
            this.HttpContext.response.conflict("The photo was already liked");
            return;
        }
        photo.Likes.push(token.User.Id);
        this.repository.update(data.PhotoId, photo);
        this.HttpContext.response.ok();
    }

    removelike(data)
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
        const photo = this.repository.findByField("Id", data.PhotoId);
        if (photo === null) {
            this.HttpContext.response.notFound("Photo not found");
            return;
        }
        const likeIndex = photo.Likes.findIndex((id) => id === token.User.Id);
        if (likeIndex === -1) {
            this.HttpContext.response.notFound("Like not found");
            return;
        }

        photo.Likes.splice(likeIndex, 1);
        this.repository.update(data.PhotoId, photo);
        this.HttpContext.response.ok();
    }

    post(data) {
        if (Authorizations.writeGranted(this.HttpContext, this.authorizations)) {
            if (this.repository != null) {
                data.Likes = [];
                data = this.repository.add(data);
                if (this.repository.model.state.isValid) {
                    this.HttpContext.response.created(data);
                } else {
                    if (this.repository.model.state.inConflict)
                        this.HttpContext.response.conflict(this.repository.model.state.errors);
                    else
                        this.HttpContext.response.badRequest(this.repository.model.state.errors);
                }
            } else
                this.HttpContext.response.notImplemented();
        } else
            this.HttpContext.response.unAuthorized();
    }
}