
let contentScrollPosition = 0;
let dropdown;
$(document).ready(() => initUI());
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Views rendering
function initUI() {
    initHeader("Connexion","default");
    renderLoginForm();
}
function showWaitingGif() {
    eraseContent();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='images/Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
const ContentType = {
    login: "login",
    signup: "signup",

}
/**
 * 
 * @param {*} text 
 * @param {*} headerType 0 : takes a ContentType 
*/
function initHeader(text, headerType = "default") {
    $("#header").empty();
    if (headerType === "default") {
        $("#header").append(
            $(`
            <span title="Liste des photos" id="listPhotosCmd">
            <img src="images/PhotoCloudLogo.png" class="appLogo">
            </span>
            <span id="viewTitle" class="viewTitle">
                ${text}
            </span>
            <div class="dropdown ms-auto">
            <div data-bs-toggle="dropdown" aria-expanded="false">
            <i class="cmdIcon fa fa-ellipsis-vertical"></i>
            </div>
            <div class="dropdown-menu noselect" id="dropdown">
            </div>
            `));
    }
    dropdown = new DropdownMenu($("#dropdown"));
    dropdown.guestMenu();
}
function updateHeader(text, updateType = "default") {
    $("#header").empty();
    if (updateType === "default") {
        $("#header").append(
            $(`
            <span title="Liste des photos" id="listPhotosCmd">
            <img src="images/PhotoCloudLogo.png" class="appLogo">
            </span>
            <span id="viewTitle" class="viewTitle">
            ${text}
            </span>
            <div class="dropdown ms-auto">
            <div data-bs-toggle="dropdown" aria-expanded="false">
            <i class="cmdIcon fa fa-ellipsis-vertical"></i>
            </div>
            <div class="dropdown-menu noselect" id="dropdown">
            </div>
            </div>
            `));
            dropdown = new DropdownMenu($("#dropdown"));
            dropdown.guestMenu();
    }
    if (updateType == "Logged") {
        const loggedUser = API.retrieveLoggedUser();
        $("#header").append(
            $(`
            <span title="Liste des photos" id="listPhotosCmd">
            <img src="images/PhotoCloudLogo.png" class="appLogo">
            </span>
            <span class="viewTitle">Liste des photos
            <div class="cmdIcon fa fa-plus" id="newPhotoCmd" title="Ajouter une photo"></div>
            </span>
            <div class="headerMenusContainer">
                <span>&nbsp;</span> <!--filler-->
                <i title="Modifier votre profil">
                    <div class="UserAvatarSmall" userid="${loggedUser.Id}" id="editProfilCmd"
                    style="background-image:url('${loggedUser.Avatar}')"
                    title="Nicolas Chourot">
                    </div>
                </i>
                <div class="dropdown ms-auto">
                    <div data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="cmdIcon fa fa-ellipsis-vertical"></i>
                    </div>
                    <div class="dropdown-menu noselect" id="dropdown">
                    </div>
                </div>
            </div>
            `)
        );
        dropdown = new DropdownMenu($("#dropdown"));
        dropdown.userMenu();
    }
}
function renderAbout() {
    timeout();
    saveContentScrollPosition();
    eraseContent();
    updateHeader("À propos...");

    $("#content").append(
        $(`
            <div class="aboutContainer">
            <h2>Gestionnaire de photos</h2>
            <hr>
                        <p>
                        Petite application de gestion de photos multiusagers à titre de démonstration
                        d'interface utilisateur monopage réactive.
                        </p>
                        <p>
                        Auteur: Nicolas Chourot
                        </p>
                        <p>
                        Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}
function renderVerificationForm(VerifError = "") {
    const user = API.retrieveLoggedUser()

    updateHeader("Verification",);
    eraseContent();
    $("#content").append($(`
        <div class="content" style="text-align:center">
        <p><b>Veuillez entrer le code de vérification que vous avez reçu par couriel</b></p>
        <form class="form" id="verifyForm">
        <input type='number'
        name='VerifyCode'
        class="form-control"
        required
        RequireMessage = 'Code de vérification de couriel'
        InvalidMessage = 'Mauvais code de vérification'
        placeholder="Code de vérification de couriel">
        <span style='color:red'>${VerifError}</span>
        <input type='submit' name='submit' value="Vérifier" class="form-control btn-primary">
        </form>
        </div>
        `))
    $('#verifyForm').on("submit", async (e) => {
        e.preventDefault();
        const verifyData = getFormData($("#verifyForm"));
        const verify = await API.verifyEmail(user.Id, verifyData.VerifyCode);
        if (verify) {
            user.VerifyCode = "verified";
            renderPhotos();
        }
        else
            renderVerificationForm("Le code ne corespond pas à celui envoyer..");
    });
}
function renderLoginForm(loginMessage = "", email = "", emailError = "", passwordError = "") {

    updateHeader("Connexion","default");
    eraseContent();
    $("#content").append(
        $(`
            <div class="content" style="text-align:center">
            <h3>${loginMessage}</h3>
            <form class="form" id="loginForm">
            <input type='email'
            name='Email'
            class="form-control"
            required
            RequireMessage = 'Veuillez entrer votre courriel'
            InvalidMessage = 'Courriel invalide'
            placeholder="adresse de courriel"
            value='${email}'>
            <span style='color:red'>${emailError}</span>
            <input type='password'
            name='Password'
            placeholder='Mot de passe'
            class="form-control"
            required
            RequireMessage = 'Veuillez entrer votre mot de passe'>
            <span style='color:red'>${passwordError}</span>
            <input type='submit' name='submit' value="Entrer" class="form-control btn-primary">
            </form>
            <div class="form">
        <hr>
        <button class="form-control btn-info" id="createProfilCmd">Nouveau compte</button>
        </div>
        </div>
        `)
    )
    $('#loginForm').on("submit", async (e) => {
        e.preventDefault();
        const login = getFormData($("#loginForm"));
        const user = await API.login(login.Email, login.Password);
        if (user) {
            // TODO: Change to content
            if (user.VerifyCode === "unverified")
                renderVerificationForm();
            else
                renderPhotos();
        }
        else {
            const errorMessage = API.currentHttpError;
            const status = API.currentStatus;
            if (status === 481)
                renderLoginForm("", login.Email, errorMessage);
            else if (status === 482)
                renderLoginForm("", login.Email, "", errorMessage);
            else {
                //TODO: render problem
                renderErrorMessage("Le serveur ne répond pas");
            }
        }
    });
    $("#createProfilCmd").click(() => renderSignUpForm());
}
function renderPhotos() {
    eraseContent();
    updateHeader("Photos", "Logged");
    $("#content").append("<p>Main page</p>");
}
function renderSignUpForm() {
    noTimeout(); // ne pas limiter le temps d’inactivité
    eraseContent(); // effacer le conteneur #content
    updateHeader("Inscription", "default"); // mettre à jour l’entête et menu
    $("#newPhotoCmd").hide(); // cammoufler l’icone de commande d’ajout de photo
    $("#content").append(`
        <form class="form" id="createProfilForm"'>
        <fieldset>
        <legend>Adresse ce courriel</legend>
        <input type="email"
        class="form-control Email"
        name="Email"
        id="Email"
        placeholder="Courriel"
        required
        RequireMessage = 'Veuillez entrer votre courriel'
        InvalidMessage = 'Courriel invalide'
        CustomErrorMessage ="Ce courriel est déjà utilisé"/>
        <input class="form-control MatchedInput"
        type="text"
        matchedInputId="Email"
        name="matchedEmail"
        id="matchedEmail"
        placeholder="Vérification"
        required
        RequireMessage = 'Veuillez entrez de nouveau votre courriel'
        InvalidMessage="Les courriels ne correspondent pas" />
        </fieldset>
        <fieldset>
        <legend>Mot de passe</legend>
        <input type="password"
        class="form-control"
        name="Password"
        id="Password"
        placeholder="Mot de passe"
        required
        RequireMessage = 'Veuillez entrer un mot de passe'
        InvalidMessage = 'Mot de passe trop court'/>
        <input class="form-control MatchedInput"
        type="password"
        matchedInputId="Password"
        name="matchedPassword"
        id="matchedPassword"
        placeholder="Vérification" required
        InvalidMessage="Ne correspond pas au mot de passe" />
        </fieldset>
        <fieldset>
        <legend>Nom</legend>
        <input type="text"
        class="form-control Alpha"
        name="Name"
        id="Name"
        placeholder="Nom"
        required
        RequireMessage = 'Veuillez entrer votre nom'
        InvalidMessage = 'Nom invalide'/>
        </fieldset>
        <fieldset>
        <legend>Avatar</legend>
        <div class='imageUploader'
        newImage='true'
        controlId='Avatar'
        imageSrc='images/no-avatar.png'
        waitingImage="images/Loading_icon.gif">
        </div>
        </fieldset>
        <input type='submit' name='submit' id='saveUserCmd' value="Enregistrer" class="form-control btn-primary">
        </form>
        <div class="cancel">
        <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
        </div>
    `);
    $('#loginCmd').on('click', renderLoginForm); // call back sur clic
    initFormValidation();
    initImageUploaders();
    $('#abortCmd').on('click', renderLoginForm); // call back sur clic
    // ajouter le mécanisme de vérification de doublon de courriel

    addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
    // call back la soumission du formulaire
    $('#createProfilForm').on("submit", async function (event) {
        let profil = getFormData($('#createProfilForm'));

        delete profil.matchedPassword;
        delete profil.matchedEmail;

        event.preventDefault();// empêcher le fureteur de soumettre une requête de soumission
        showWaitingGif(); // afficher GIF d’attente
        const result = await API.register(profil); // commander la création au service API

        if (result) {
            renderLoginForm("Votre compte a été créé. Veuillez prendre vos courriels pour récupérer votre code de " +
                "vérification qui vous sera demandé lors de votre prochaine connexion");
        }
    });

}
function renderErrorMessage(errorMessage = "") {
    updateHeader("Problème");
    eraseContent();
    $("#content").append(
        $(` <div class="errorContainer"><b>${errorMessage}</b></div>
            <hr>
            <button class="form-control btn-primary" id="connectionButton">Connexion</button>
        `)
    );
    $("#connectionButton").click(() => renderLoginForm());
}
function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}
class DropdownMenu {
    constructor(appendTo) {
        this.appendTo = appendTo;
    }

    guestMenu() {
        this.clear();
        this.login();
        this.divider();
        this.about();
    }
    userMenu() {
        this.clear();
        this.logout();
        this.editProfile();
        this.divider();
        this.listPictures();
        this.divider();
        this.sortByDate(true);
        this.sortByOwners(false);
        this.sortByLikes(false);
        this.sortBySelf(false);
        this.divider();
        this.about();
    }
    adminMenu() {
        this.clear();
        this.manageUsers();
        this.divider();
        this.logout();
        this.editProfile();
        this.divider();
        this.listPictures();
        this.divider();
        this.sortByDate(true);
        this.sortByOwners(false);
        this.sortByLikes(false);
        this.sortBySelf(false);
        this.divider();
        this.about();
    }
    clear() {
        this.appendTo.empty();
    }
    login() {
        this.addItem("loginDropdownBtn", "Connexion", "fa-sign-in", () => renderLoginForm());
    }
    logout() {
        this.addItem("logoutDropdownBtn", "Déconnexion", "fa-sign-out",() => logout());
    }
    about() {
        this.addItem("aboutDropdownBtn", "À propos...", "fa-info-circle",() => renderAbout());
    }
    editProfile() {
        this.addItem("editProfileDropdownBtn", "Modifier le profil", "fa-user-edit",() => editProfile());
    }
    listPictures() {
        this.addItem("listPicturesDrodownBtn", "Liste des photos", "fa-image",() => renderPhotos());
    }
    manageUsers() {
        this.addItem("managerUsersDropdownBtn", "Gestion des usagers", "fa-user-cog",() => managerUsers());
    }
    sortByDate(selected) {
        this.addItem("sortByDateDropdownBtn", "Photos par date de création", "fa-calendar",() => renderPhotos(), selected);
    }
    sortByOwners(selected) {
        this.addItem("sortByOwnerDropdownBtn", "Photos par créateur", "fa-users",() => renderPhotos(), selected); //TODO: programatically sort pictures
    }
    sortByLikes(selected) {
        this.addItem("sortByLikesDropdownBtn", "Photos les plus aimées", "fa-heart",() => renderPhotos(), selected);
    }
    sortBySelf(selected) {
        this.addItem("sortBySelfDropdownBtn", "Mes photos", "fa-user",() => renderPhotos(), selected);
    }

    divider() {
        this.appendTo.append(`<div class="dropdown-divider"></div>`);
    }


    addItem(id, content, icon, action, selected = null) {
        this.appendTo.append(`<span class="dropdown-item" id="${id}">
        ${selected === null || selected === undefined ? "" : `<i class="menuIcon fa fa-${selected ? "check" : "fw"} max-2"></i>` /* null: doesn't add margin, true: add checkmark, false: add margin */}
        <i class="menuIcon fas ${icon} mx-2"></i>
        ${content}
        </span>`);

        $(`#${id}`).click(action);
    }
}

function logout() {
    API.logout();
    renderLoginForm();
}

function editProfile() {

}

async function manageUsers()
{
    const accounts = await API.GetAccounts();

    if (accounts)
    {
        renderManagerUsers(accounts);
    }
    else
    {
        const errorMessage = API.currentHttpError;
        const status = API.currentStatus;

        await API.logout();
        renderErrorMessage(errorMessage);
    }
}

function renderManagerUsers(accounts)
{
    console.log(accounts.data);
    const content = $("#content");
    content.empty();
    content.append(`<div class="UserContainer"></div>`);
    const container = $(".UserContainer");
    accounts.data.forEach(user => 
    {
        const isAdmin = user.Authorizations.readAccess == 2 && user.Authorizations.writeAccess == 2;
        const isBlocked = user.Authorizations.readAccess == -1 && user.Authorizations.writeAccess == -1;
        container.append(`
            <div class="UserLayout">
                <img class="UserAvatar" src="${user.Avatar}">
                <div class"UserInfo">
                    <div class="UserName">${user.Name}</div>
                    <div class="UserEmail">${user.Email}</div>
                </div>
            </div>
            <div class="UserCommandPanel">
                <i data-cmdPromote class="fas fa-user-${isAdmin ? "cog" : "alt"} dodgerblueCmd cmdIconVisible" 
                title="${isAdmin ? "Retirer les droits administrateur" : "Promouvoir administrateur"}"></i>

                <i data-cmdBlock class="fa ${isBlocked ? "fa-ban redCmd" : "fa-regular fa-circle greenCmd cmdIconVisible"}" 
                title="${isBlocked ? "Débloquer l'accès" : "Bloquer l'accès"}"></i>
                <i data-cmdRemove class="fas fa-user-slash cmdIconVisible goldenrodCmd" title="Effacer l'usager"></i>
            </div>

        `);

        const userHTML = container.children().last();
        userHTML.find("i[data-cmdPromote]").click(() => isAdmin ? changeUserPermissions(user, 1, 1) : changeUserPermissions(user, 2, 2));
        userHTML.find("i[data-cmdBlock]").click(() => isBlocked ? changeUserPermissions(user, 1, 1) : changeUserPermissions(user, -1, -1));
        userHTML.find("i[data-cmdRemove]").click(() => deleteUser(user));
    });
}

async function changeUserPermissions(user, writeAccess, readAccess)
{
    user.Authorizations.writeAccess = writeAccess;
    user.Authorizations.readAccess = readAccess;
    delete user.Email;
    delete user.Name;
    delete user.Password;
    delete user.Avatar;
    delete user.VerifyCode;
    if (await API.modifyUserProfil(user))
        manageUsers();
    else
    {
        const errorMessage = API.currentHttpError;

        await API.logout();
        renderErrorMessage(errorMessage);
    }
}

async function deleteUser(user)
{
    console.log("delete");
}