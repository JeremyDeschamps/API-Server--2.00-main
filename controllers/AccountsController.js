import UserModel from '../models/user.js';
import PhotosModel from '../models/photo.js';
import Repository from '../models/repository.js';
import TokenManager from '../tokensManager.js';
import * as utilities from "../utilities.js";
import Gmail from "../gmail.js";
import Controller from './Controller.js';
import Authorizations from '../authorizations.js';

export default class AccountsController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new UserModel()), Authorizations.admin());
    }
    index(id) {
        if (id != undefined) {
            if (Authorizations.readGranted(this.HttpContext, Authorizations.admin()))
                this.HttpContext.response.JSON(this.repository.get(id));
            else
                this.HttpContext.response.unAuthorized("Unauthorized access");
        }
        else {
            if (Authorizations.readGranted(this.HttpContext, Authorizations.admin()))
                this.HttpContext.response.JSON(this.repository.getAll(this.HttpContext.path.params), this.repository.ETag, true, Authorizations.admin());
            else
                this.HttpContext.response.unAuthorized("Unauthorized access");
        }
    }
    // POST: /token body payload[{"Email": "...", "Password": "..."}]
    login(loginInfo) {
    
        if (!loginInfo) 
        {
            this.HttpContext.response.badRequest("Credential Email and password are missing.");
            return;
        }

        if (this.repository == null)
        {
            this.HttpContext.response.notImplemented();
            return;
        }

        let user = this.repository.findByField("Email", loginInfo.Email);     
        if (user == null)
        {
            this.HttpContext.response.userNotFound("This user email is not found.");
            return;
        }

        if (user.Password != loginInfo.Password)
        {
            this.HttpContext.response.wrongPassword("Wrong password.");
            return;
        }

        user = this.repository.get(user.Id);

        if (user.Authorizations.readAccess === -1 && user.Authorizations.writeAccess === -1)
        {
            this.HttpContext.response.forbidden("Your account is blocked.");
            return;
        }
        let newToken = TokenManager.create(user);
        this.HttpContext.response.created(newToken);
    }
    logout() {
        let userId = this.HttpContext.path.params.userId;
        if (userId) {
            TokenManager.logout(userId);
            this.HttpContext.response.accepted();
        } else {
            this.HttpContext.response.badRequest("UserId is not specified.")
        }
    }

    sendVerificationEmail(user) {
        user = this.repository.findByField("Id",user.Id);
        let html = `
                Bonjour ${user.Name}, <br /> <br />
                Voici votre code pour confirmer votre adresse de courriel
                <br />
                <h3>${user.VerifyCode}</h3>
            `;
        const gmail = new Gmail();
        gmail.send(user.Email, 'Vérification de courriel...', html);
    }

    sendConfirmedEmail(user) {
        let html = `
                Bonjour ${user.Name}, <br /> <br />
                Votre courriel a été confirmé.
            `;
        const gmail = new Gmail();
        gmail.send(user.Email, 'Courriel confirmé...', html);
    }

    //GET : /accounts/verify?id=...&code=.....
    verify() {
        if (this.repository != null) {
            let id = this.HttpContext.path.params.id;
            let code = parseInt(this.HttpContext.path.params.code);
            let userFound = this.repository.findByField('Id', id);
            if (userFound) {
                if (userFound.VerifyCode == code) {
                    userFound.VerifyCode = "verified";
                    userFound = this.repository.update(userFound.Id, userFound);
                    if (this.repository.model.state.isValid) {
                        this.HttpContext.response.updated(userFound);
                        this.sendConfirmedEmail(userFound);
                    } else {
                        this.HttpContext.response.unprocessable();
                    }
                } else {
                    this.HttpContext.response.unverifiedUser("Verification code does not matched.");
                }
            } else {
                this.HttpContext.response.unprocessable();
            }
        } else
            this.HttpContext.response.notImplemented();
    }
    //GET : /accounts/conflict?Id=...&Email=.....
    conflict() {
        if (this.repository != null) {
            let id = this.HttpContext.path.params.Id;
            let email = this.HttpContext.path.params.Email;
            if (id && email) {
                let prototype = { Id: id, Email: email };
                this.HttpContext.response.updated(this.repository.checkConflict(prototype));
            } else
                this.HttpContext.response.updated(false);
        } else
            this.HttpContext.response.updated(false);
    }

    // POST: account/register body payload[{"Id": 0, "Name": "...", "Email": "...", "Password": "..."}]
    register(user) {
        if (this.repository != null) {
            user.Created = utilities.nowInSeconds();
            user.VerifyCode = utilities.makeVerifyCode(6);
            user.Authorizations = Authorizations.user();
            let newUser = this.repository.add(user);
            if (this.repository.model.state.isValid) {
                this.HttpContext.response.created(newUser);
                this.sendVerificationEmail(newUser);
            } else {
                if (this.repository.model.state.inConflict)
                    this.HttpContext.response.conflict(this.repository.model.state.errors);
                else
                    this.HttpContext.response.badRequest(this.repository.model.state.errors);
            }
        } else
            this.HttpContext.response.notImplemented();
    }
    // PUT:account/modify body payload[{"Id": 0, "Name": "...", "Email": "...", "Password": "..."}]
    modify(user) {
        // empty asset members imply no change and there values will be taken from the stored record
        const isAdmin = Authorizations.writeGranted(this.HttpContext, Authorizations.admin());
        if (Authorizations.writeGranted(this.HttpContext, Authorizations.user())) {
            if (this.repository != null) {
                user.Created = utilities.nowInSeconds();
                let foundedUser = this.repository.findByField("Id", user.Id);
                if (foundedUser != null) {
                    if (user.Authorizations === null || user.Authorizations === undefined || !isAdmin)
                        user.Authorizations = foundedUser.Authorizations; // user cannot change its own authorizations
                    user.VerifyCode = foundedUser.VerifyCode;
                    if (user.Password === undefined || user.Password === '') { // password not changed
                        user.Password = foundedUser.Password;
                    }
                    if (user.Avatar === undefined) user.Avatar = foundedUser.Avatar;
                    if (user.Email != foundedUser.Email) {
                        user.VerifyCode = utilities.makeVerifyCode(6);
                        this.sendVerificationEmail(user);
                    }
                    let updatedUser = this.repository.update(user.Id, user);
                    if (this.repository.model.state.isValid) {
                        this.HttpContext.response.updated(updatedUser);
                    }
                    else {
                        if (this.repository.model.state.inConflict)
                            this.HttpContext.response.conflict(this.repository.model.state.errors);
                        else
                            this.HttpContext.response.badRequest(this.repository.model.state.errors);
                    }
                } else
                    this.HttpContext.response.notFound();
            } else
                this.HttpContext.response.notImplemented();
        } else
            this.HttpContext.response.unAuthorized();
    }
    // GET:account/remove/id
    remove(id) { // warning! this is not an API endpoint
        if (Authorizations.writeGranted(this.HttpContext, Authorizations.user()))
        {
            const previousAuthorizations = this.authorizations;
            this.authorizations = Authorizations.user();
            this.fullyRemove(id);
            this.authorizations = previousAuthorizations;
        }
    }

    fullyRemove(id) {
        if (Authorizations.writeGranted(this.HttpContext, this.authorizations)) {
            if (this.repository != null) {
                if (this.HttpContext.path.id) {
                    const photosRepository = new Repository(new PhotosModel(), true);
                    const likedPhotos = photosRepository.findByFilter((user) => user.Likes.some((likeId) => likeId === id));
                    if (this.repository.remove(id)) {
                        
                        for (const likePhoto of likedPhotos) {
                            const index = likePhoto.Likes.findIndex((likeId) => likeId === id);
                            likePhoto.Likes.splice(index, 1);
                            this.repository.update(likePhoto.Id, likePhoto);
                        }
                        photosRepository.keepByFilter((photo) => photo.OwnerId !== id);
                        this.HttpContext.response.accepted();
                    }
                    else
                        this.HttpContext.response.notFound("Ressource not found.");
                } else
                    this.HttpContext.response.badRequest("The Id in the request url is rather not specified or syntactically wrong.");
            } else
                this.HttpContext.response.notImplemented();
        } else
            this.HttpContext.response.unAuthorized("Unauthorized access");
    }
}