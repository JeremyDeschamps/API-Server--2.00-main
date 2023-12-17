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
}