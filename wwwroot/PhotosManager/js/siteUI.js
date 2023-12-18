const FilterType = {
    date: "date",
    owners: "owners",
    likes: "likes",
    self: "self",
    none: "none",
}
const ContentType = {
    login: "login",
    signup: "signup",

}

let contentScrollPosition = 0;

let offset = 0;
let previousScrollPosition = 0;
let limit = 0;
let endOfData = false;

let dropdown;
let filter = FilterType.none;
let currentETag;
let periodicalRefresh;

$(document).ready(() => initUI());

// pour la pagination
let photoContainerWidth = 400;
let photoContainerHeight = 400;
let HorizontalPhotosCount;
let VerticalPhotosCount;

// pour la pagination
function getViewPortPhotosRanges() {
    // estimate the value of limit according to height of content
    VerticalPhotosCount = Math.round($("#content").innerHeight() / photoContainerHeight);
    HorizontalPhotosCount = Math.round($("#content").innerWidth() / photoContainerWidth);
    limit = (VerticalPhotosCount + 1) * HorizontalPhotosCount;
    console.log("VerticalPhotosCount:", VerticalPhotosCount, "HorizontalPhotosCount:", HorizontalPhotosCount)
    offset = 0;
}
// pour la pagination
function installWindowResizeHandler() {
    var resizeTimer = null;
    var resizeEndTriggerDelai = 250;
    $(window).on('resize', function (e) {
        if (!resizeTimer) {
            $(window).trigger('resizestart');
        }
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            resizeTimer = null;
            $(window).trigger('resizeend');
        }, resizeEndTriggerDelai);
    }).on('resizestart', function () {
        console.log('resize start');
    }).on('resizeend', function () {
        console.log('resize end');
        if ($('#photosLayout') != null) {
            getViewPortPhotosRanges();
        }
    });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Views rendering
function initUI() {
    getViewPortPhotosRanges();
    initTimeout(9999999999999999, () => renderLoginForm("Votre session est expirée. Veuillez vous reconnecter."));
    installWindowResizeHandler();
    initHeader("Connexion", "default");
    renderLoginForm();
}
function showWaitingGif() {
    eraseContent();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='images/Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
    clearInterval(periodicalRefresh);
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
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
            <span title="Liste des photos">
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
            <span title="Liste des photos">
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
    else if (updateType == "logged") {
        const loggedUser = API.retrieveLoggedUser();
        $("#header").append(
            $(`
            <span title="Liste des photos" id="listPhotosCmd">
            <img src="images/PhotoCloudLogo.png" class="appLogo">
            </span>
            <span class="viewTitle">${text}
            <div class="cmdIcon fa fa-plus" id="newPhotoCmd" title="Ajouter une photo"></div>
            </span>
            <div class="headerMenusContainer">
                <span>&nbsp;</span> <!--filler-->
                <i title="Modifier votre profil">
                    <div class="UserAvatarSmall" userid="${loggedUser.Id}" id="editProfilCmd"
                    style="background-image:url('${loggedUser.Avatar}')"
                    title="${loggedUser.Name}">
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
    else if (updateType == "admin") {
        const loggedUser = API.retrieveLoggedUser();
        $("#header").append(
            $(`
            <span title="Liste des photos" id="listPhotosCmd">
            <img src="images/PhotoCloudLogo.png" class="appLogo">
            </span>
            <span class="viewTitle">${text}
            <div class="cmdIcon fa fa-plus" id="newPhotoCmd" title="Ajouter une photo"></div>
            </span>
            <div class="headerMenusContainer">
                <span>&nbsp;</span> <!--filler-->
                <i title="Modifier votre profil">
                    <div class="UserAvatarSmall" userid="${loggedUser.Id}" id="editProfilCmd"
                    style="background-image:url('${loggedUser.Avatar}')"
                    title="${loggedUser.Name}">
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
        dropdown.adminMenu();
    }

    const editBtn = $("#editProfilCmd");
    if (editBtn.length !== 0)
        editBtn.click(() => renderEditProfileForm());

    const listPhotosBtn = $("#listPhotosCmd");
    if (listPhotosBtn.length !== 0)
        listPhotosBtn.click(() => renderPhotos(true));

    const addPhotoBtn = $("#newPhotoCmd");
    if (addPhotoBtn.length !== 0)
        addPhotoBtn.click(() => renderAddPhoto());

}
function renderAbout() {
    const loggedUser = API.retrieveLoggedUser();
    let type = "default";
    if (loggedUser != undefined)
        type = loggedUser.Authorizations.readAccess === 2 && loggedUser.Authorizations.writeAccess === 2 ? "admin" : "logged";


    timeout();
    saveContentScrollPosition();
    eraseContent();
    updateHeader("À propos...", type);

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
                        Auteur: Alexandre Lacombe, Jérémy Deschamps
                        </p>
                        <p>
                        Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}
function renderVerificationForm(VerifError = "") {
    const user = API.retrieveLoggedUser();
    updateHeader("Verification", "logged");
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
            filter = FilterType.none;
            contentScrollPosition = 0;
            renderPhotos(true);
        }
        else
            renderVerificationForm("Le code ne correspond pas à celui envoyé..");
    });
}
function renderLoginForm(loginMessage = "", email = "", emailError = "", passwordError = "") {
    noTimeout();
    updateHeader("Connexion", "default");
    eraseContent();
    $("#content").append(
        $(`
            <div class="content" style="text-align:center">
            <div class="errorContainer">${loginMessage}</div>
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
            else {
                filter = FilterType.none;
                contentScrollPosition = 0;
                renderPhotos(true);
            }
        }
        else {
            const errorMessage = API.currentHttpError;
            const status = API.currentStatus;
            switch (status) {
                case 481:
                    renderLoginForm("", login.Email, errorMessage);
                    break;

                case 482:
                    renderLoginForm("", login.Email, "", errorMessage);
                    break;

                case 403:
                    renderErrorMessage(errorMessage);
                    break;

                default:
                    renderErrorMessage("Le serveur ne répond pas");
                    break;
            }
        }
    });
    $("#createProfilCmd").click(() => renderSignUpForm());
}
async function renderPhotos(refresh = false) {
    const user = await API.retrieveLoggedUser();
    let photosCount = limit * (offset + 1);
    let query = refresh ? "?limit=" + photosCount + "&offset=" + 0 : "?limit=" + limit + "&offset=" + offset;

    if (refresh) {
        saveContentScrollPosition();
        eraseContent();

        offset = 0;
    }
    switch (filter) {
        case FilterType.date:
            query += "sort=Date";
            break;
        case FilterType.self:
            query += "OwnerId=" + user.Id;
            break;
    }
    const photos = await API.GetPhotos(query);

    if (photos.data !== null) {
        if (photos.data.length > 0) {
            eraseContent();
            $("#content").off();
            if (!photos) {
                const errorMessage = API.currentHttpError;
                const status = API.currentStatus;

                await API.logout();
                renderErrorMessage(errorMessage);
                return;

            }
            const eTag = await API.GetPhotosETag();
            if (eTag) {
                currentETag = eTag;
            }
            periodicalRefresh = setInterval(() => photosPeriodicalRefresh(), 10000);

            if (user.Authorizations.readAccess === 2 && user.Authorizations.writeAccess === 2)
                updateHeader("Photos", "admin");
            else
                updateHeader("Photos", "logged");

            $("#content").append($("<div id='photosList' class='photosLayout'>"));
            const container = $("#photosList");

            switch (filter) {
                case FilterType.owners:
                    photos.data.sort((x, y) => y.OwnerName > x.OwnerName ? 1 : -1);
                    break;

                case FilterType.likes:
                    photos.data.sort((x, y) => y.Likes.length > x.Likes.length ? 1 : -1);
                    break;

                default:
                    break;
            }

            for (const photo of photos.data) {
                const shared = user.Id === photo.OwnerId && photo.Shared;
                photo.Likes.sort(function (x, y) { return x.Id === user.Id ? -1 : y.Id === user.Id ? 1 : 0; });
                const wasLikedByUser = photo.Likes.some((like) => like.Id == user.Id);

                const likeList = photo.Likes.map((like) => like.Name);

                console.log(likeList.slice(0, 10).join("&#013;"));
                container.append(`
                    <div class="photoLayout">
                        <div class="photosTitleContainer">
                            <span class="photoTitle">${photo.Title}</span>
                            <span class="editCmd cmdIcon fa fa-pencil" title="Modifier"></span>
                            <span class="deleteCmd cmdIcon fa fa-trash" title="Effacer"></span>
                        </div>
                        <div class="photoImage" style="background-image: url(${photo.Image})">
                            <div class="UserAvatarSmall" style="background-image: url(${photo.OwnerAvatar})" title="${photo.OwnerName}"></div>
                            ${shared ? `<img class="UserAvatarSmall" src="images/shared.png" title="Partagé">` : ""}
                        </div>
                        <div class="photoCreationDate">${convertToFrenchDate(photo.Date)} 
                            <span class="likesSummary">
                                <span class="likesCount">${photo.Likes.length}</span>
                                <i title="${likeList.slice(0, 10).join("&#013;")}" class="${wasLikedByUser ? "fa fa-thumbs-up" : "fa-regular fa-thumbs-up"} cmdIconVisible" style="color: blue;"></i>
                            </span>
                        </div>
                    </div>`);

                const photoHTML = container.children().last();
                photoHTML.find(".photoImage").click(() => renderPhotosDetails(photo, likeList, user));
                attachLikeButtonBehaviour(photoHTML.find(".fa-thumbs-up"), photoHTML.find(".likesCount"), wasLikedByUser, likeList, photo.Id, user.Name);

                if (photo.OwnerId !== user.Id) {
                    photoHTML.find(".editCmd").hide();
                    photoHTML.find(".deleteCmd").hide();
                }

                photoHTML.find(".editCmd").click(() => renderEditPhoto(photo));
                photoHTML.find(".deleteCmd").click(() => renderDeletePhoto(photo));
            }
            $("#photosList").append($("<hr>"));
            $("#content").off();
            $("#content").on("scroll", function () {
                console.log($("#content").scrollTop())
                if ($("#content").scrollTop() + $("#content").innerHeight() > ($("#photosList").height())) {
                    offset++;
                    renderPhotos();
                }
            });
        } else {
            endOfData = true;
        }
    }

}
function renderPhotosDetails(photo, likeList, user) {
    timeout();
    eraseContent();
    const wasLikedByUser = photo.Likes.some((like) => like.Id == user.Id);
    $("#content").append(`
        <div class="photoDetailsOwner">${photo.OwnerName}</div>
        <hr>
        <div class="photoDetailsTitle">${photo.Title}</div>
        <img class="photoDetailsLargeImage" src=${photo.Image}>
        <div class="photoDetailsCreationDate">${convertToFrenchDate(photo.Date)} 
            <span class="likesSummary">
                <span class="likesCount">${photo.Likes.length}</span>
                <i title="${likeList.slice(0, 10).join("&#013;")}" class="${wasLikedByUser ? "fa fa-thumbs-up" : "fa-regular fa-thumbs-up"} cmdIconVisible" style="color: blue;"></i>
            </span>
        </div>
        <div class="photoDetailsDescription">${photo.Description} </div>
    `);
    attachLikeButtonBehaviour($(".fa-thumbs-up"), $(".likesCount"), wasLikedByUser, likeList, photo.Id, user.Name);
}
function attachLikeButtonBehaviour(likeButton, likeCount, pressed, likeList, photoId, name) {
    likeButton.click(async () => {
        if (pressed) {
            const result = await API.removeLike(photoId);
            if (result) {
                likeButton.removeClass("fa");
                likeButton.addClass("fa-regular");
                likeCount.text(Number(likeCount.text()) - 1);
                likeList.shift();
                likeButton.attr("title", likeList.slice(0, 10).join("\r\n"));
                pressed = !pressed;
            } else {
                console.log(API.currentHttpError);
            }
        } else {
            const result = await API.addLike(photoId);
            if (result) {
                likeButton.removeClass("fa-regular");
                likeButton.addClass("fa");
                likeCount.text(Number(likeCount.text()) + 1);
                likeList.unshift(name);
                likeButton.attr("title", likeList.slice(0, 10).join("\r\n"));
                pressed = !pressed;
            } else {
                console.log(API.currentHttpError);
            }
        }

    });
}
function renderAddPhoto(errorMessage = "") {
    timeout();
    eraseContent();
    const user = API.retrieveLoggedUser();

    if (user.Authorizations.readAccess === 2 && user.Authorizations.writeAccess === 2)
        updateHeader("Photos", "admin");
    else
        updateHeader("Photos", "logged");


    $("#content").append(`
        <form class="form" id="addPhotoForm"'>
        <fieldset>
        <legend>Information</legend>
        <input type="text"
        class="form-control Alpha"
        name="Title"
        id="Title"
        placeholder="Titre"
        required
        RequireMessage = 'Veuillez entrer un titre'
        InvalidMessage = 'Titre invalide'
        value="">
        <span style='color:red'>${errorMessage}</span>
        <textarea type="text"
        class="form-control Alpha"
        name="Description"
        id="Description"
        placeholder="Description"
        required
        RequireMessage = 'Veuillez entrer une description'
        InvalidMessage = 'Description invalide'
        value="" ></textarea>
        <br>
        <input type="checkbox" name="sharedCheck" id="sharedCheck"><label for="shared">Partager</label>
        <br>
        </fieldset>
        <fieldset>
        <legend>Image</legend>
        <div class='imageUploader'
        newImage='1'
        controlId='Image'
        imageSrc='images/photoCloudLogo.png'
        waitingImage="images/Loading_icon.gif">
        </div>
        </fieldset>
        <input type='submit'
        name='submit'
        id='addPhotoCmd'
        value="Enregistrer"
        class="form-control btn-primary">
        </form>
        <div class="cancel">
        <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
        </div>
    `);
    initFormValidation();
    initImageUploaders();
    $("#abortCmd").click(() => renderPhotos());

    $('#addPhotoForm').on("submit", async function (event) {
        let photo = getFormData($('#addPhotoForm'));

        photo.OwnerId = user.Id
        photo.Date = Date.now();
        photo.Shared = $("#sharedCheck").is(':checked');

        event.preventDefault();//  empêcher le fureteur de soumettre une requête de soumission
        showWaitingGif(); // afficher GIF d’attente
        const result = await API.CreatePhoto(photo); // commander la création au service API
        if (result)
            renderPhotos(true);
        else {
            const errorMessage = API.currentHttpError;
            const status = API.currentStatus;

            switch (status) {
                case 409:
                    renderAddPhoto("Titre dejà utillisé");
                    break;

                default:
                    renderErrorMessage("Le serveur ne répond pas");
                    break;
            }
        }
    });
}
function renderEditPhoto(photo, errorMessage = "") {
    timeout();
    eraseContent();
    const user = API.retrieveLoggedUser();
    if (user.Authorizations.readAccess === 2 && user.Authorizations.writeAccess === 2)
        updateHeader("Photos", "admin");
    else
        updateHeader("Photos", "logged");


    $("#content").append(`
        <form class="form" id="modifyPhotodForm"'>
        <fieldset>
        <legend>Information</legend>
        <input type="text"
        class="form-control Alpha"
        name="Title"
        id="Title"
        required
        RequireMessage = 'Veuillez entrer un titre'
        InvalidMessage = 'Titre invalide'
        value="${photo.Title}">
        <span style='color:red'>${errorMessage}</span>
        <textarea type="text"
        class="form-control Alpha"
        name="Description"
        id="Description"
        placeholder="Description"
        required
        RequireMessage = 'Veuillez entrer une description'
        InvalidMessage = 'Description invalide' 
        >${photo.Description}</textarea>
        <br>
        <input type="checkbox" name="sharedCheck" id="sharedCheck"><label for="shared">Partager</label>
        <br>
        </fieldset>
        <fieldset>
        <legend>Image</legend>
        <div class='imageUploader'
        newImage='true'
        controlId='Image'
        imageSrc='${photo.Image}'
        waitingImage="images/Loading_icon.gif">
        </div>
        </fieldset>
        <input type='submit'
        name='submit'
        id='saveUserCmd'
        value="Enregistrer"
        class="form-control btn-primary">
        </form>
        <div class="cancel">
        <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
        </div>
    `);
    if (photo.Shared)
        photo.Shared = $("#sharedCheck").prop("checked", true);
    initFormValidation();
    initImageUploaders();
    $("#abortCmd").click(() => renderPhotos());

    $('#modifyPhotodForm').on("submit", async function (event) {
        let photoModified = getFormData($('#modifyPhotodForm'));

        photoModified.Id = photo.Id
        photoModified.OwnerId = user.Id
        photoModified.Date = Date.now();
        photoModified.Shared = $("#sharedCheck").is(':checked');


        event.preventDefault();//  empêcher le fureteur de soumettre une requête de soumission
        showWaitingGif(); // afficher GIF d’attente
        const result = await API.UpdatePhoto(photoModified); // commander la création au service API

        if (result) {
            renderPhotos(true);
        }
        else {
            const errorMessage = API.currentHttpError;
            const status = API.currentStatus;

            switch (status) {
                case 409:
                    renderAddPhoto("Titre dejà utillisé");
                    break;

                default:
                    renderErrorMessage("Le serveur ne répond pas");
                    break;
            }
        }
    });
}
function renderDeletePhoto(photo) {
    noTimeout();
    eraseContent();
    updateHeader("Retrait de compte", "logged");
    $("#content").append(
        $(`
        <div class="content form" style="text-align:center">
        <h3>Voulez vous vraiment effacer cet usager et toutes ses photos ?</h3>
        <div class="UserLayout">
            <div class"UserInfo">
                <div class="UserName">${photo.Title}</div>
                <img class="UserAvatar" src="${photo.Image}">
            </div>
        </div>
        <button class="form-control btn-danger" id="effacerButton">Effacer</button>
        <br>
        <button class="form-control btn-secondary" id="annulerButton">Annuler</button>
        </div>
        `)
    );
    $("#effacerButton").click(async () => {
        if (await API.DeletePhoto(photo.Id))
            renderPhotos(); //TO-DO: retourner a la page d'Avant
        else
            renderErrorMessage("Deletion not completed and Error");

    });
    $("#annulerButton").click(() => renderPhotos());
}
function renderEditProfileForm() {
    const loggedUser = API.retrieveLoggedUser();
    const type = loggedUser.Authorizations.readAccess === 2 && loggedUser.Authorizations.writeAccess === 2 ? "admin" : "logged";

    timeout();
    eraseContent();
    updateHeader("Modifier le profil", type);

    $("#content").append(`
        <form class="form" id="editProfilForm"'>
        <input type="hidden" name="Id" id="Id" value="${loggedUser.Id}"/>
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
        CustomErrorMessage ="Ce courriel est déjà utilisé"
        value="${loggedUser.Email}" >
        <input class="form-control MatchedInput"
        type="text"
        matchedInputId="Email"
        name="matchedEmail"
        id="matchedEmail"
        placeholder="Vérification"
        required
        RequireMessage = 'Veuillez entrez de nouveau votre courriel'
        InvalidMessage="Les courriels ne correspondent pas"
        value="${loggedUser.Email}" >
        </fieldset>
        <fieldset>
        <legend>Mot de passe</legend>
        <input type="password"
        class="form-control"
        name="Password"
        id="Password"
        placeholder="Mot de passe"
        InvalidMessage = 'Mot de passe trop court' >
        <input class="form-control MatchedInput"
        type="password"
        matchedInputId="Password"
        name="matchedPassword"
        id="matchedPassword"
        placeholder="Vérification"
        InvalidMessage="Ne correspond pas au mot de passe" >
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
        InvalidMessage = 'Nom invalide'
        value="${loggedUser.Name}" >
        </fieldset>
        <fieldset>
        <legend>Avatar</legend>
        <div class='imageUploader'
        newImage='false'
        controlId='Avatar'
        imageSrc='${loggedUser.Avatar}'
        waitingImage="images/Loading_icon.gif">
        </div>
        </fieldset>
        <input type='submit'
        name='submit'
        id='saveUserCmd'
        value="Enregistrer"
        class="form-control btn-primary">
        </form>
        <div class="cancel">
        <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
        </div>
        <div class="cancel"> <hr>
        <button id="deleteAccount" class="form-control btn-warning">Effacer le compte</button>
        </div>
    `);

    initFormValidation();
    initImageUploaders();
    $('#abortCmd').on('click', () => renderPhotos()); // call back sur clic
    // ajouter le mécanisme de vérification de doublon de courriel
    $('#deleteAccount').click(async () => {
        if (await API.unsubscribeAccount(loggedUser.Id))
            renderLoginForm(); //TO-DO: retourner a la page d'Avant
        else
            renderErrorMessage("Error deleting user...");
    });

    addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
    // call back la soumission du formulaire
    $('#editProfilForm').on("submit", async function (event) {
        let profil = getFormData($('#editProfilForm'));

        delete profil.matchedPassword;
        delete profil.matchedEmail;

        event.preventDefault();// empêcher le fureteur de soumettre une requête de soumission
        showWaitingGif(); // afficher GIF d’attente
        const result = await API.modifyUserProfil(profil); // commander la création au service API

        if (result)
            renderPhotos(true);
        else
            renderErrorMessage(API.currentHttpError);
    });

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
        newImage='1'
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
    $('#loginCmd').on('click', () => renderLoginForm()); // call back sur clic
    initFormValidation();
    initImageUploaders();
    $('#abortCmd').on('click', () => renderLoginForm()); // call back sur clic
    // ajouter le mécanisme de vérification de doublon de courriel

    addConflictValidation(API.checkConflictURL(), 'Email', 'saveUserCmd');
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
        else
            renderErrorMessage(API.currentHttpError);
    });

}
function renderErrorMessage(errorMessage = "") {
    noTimeout();
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
function renderDeleteUser(user) {
    noTimeout();
    eraseContent();
    updateHeader("Retrait de compte", "logged");
    $("#content").append(
        $(`
        <div class="content form" style="text-align:center">
        <h3>Voulez vous vraiment effacer cet usager et toutes ses photos ?</h3>
        <div class="UserLayout">
        <img class="UserAvatar" src="${user.Avatar}">
        <div class"UserInfo">
        <div class="UserName">${user.Name}</div>
        <div class="UserEmail">${user.Email}</div>
        </div>
        </div>
        <button class="form-control btn-danger" id="effacerButton">Effacer</button>
        <br>
        <button class="form-control btn-secondary" id="annulerButton">Annuler</button>
        </div>
        `)
    );
    $("#effacerButton").click(async () => {
        if (await API.unsubscribeAccount(user.Id))
            manageUsers(); //TO-DO: retourner a la page d'Avant
        else
            renderErrorMessage("Deletion not completed and Error");

    });
    $("#annulerButton").click(() => manageUsers());
}
function logout() {
    API.logout();
    renderLoginForm();
}
async function manageUsers() {
    const accounts = await API.GetAccounts();

    if (accounts) {
        renderManagerUsers(accounts);
    }
    else {
        const errorMessage = API.currentHttpError;
        const status = API.currentStatus;

        await API.logout();
        renderErrorMessage(errorMessage);
    }
}
function renderManagerUsers(accounts) {
    timeout();
    const loggedUser = API.retrieveLoggedUser();
    console.log(accounts.data);
    const content = $("#content");
    content.empty();
    content.append(`<div class="UserContainer"></div>`);
    const container = $(".UserContainer");
    accounts.data.forEach(user => {
        if (user.Id == loggedUser.Id)
            return;
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
        
        <i data-cmdBlock class="fa ${isBlocked ? "fa-ban redCmd" : "fa-regular fa-circle greenCmd"} cmdIconVisible" 
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
async function changeUserPermissions(user, writeAccess, readAccess) {
    user.Authorizations.writeAccess = writeAccess;
    user.Authorizations.readAccess = readAccess;
    delete user.Password;
    delete user.Avatar;
    if (await API.modifyUserProfil(user))
        manageUsers();
    else {
        const errorMessage = API.currentHttpError;

        await API.logout();
        renderErrorMessage(errorMessage);
    }
}
async function deleteUser(user) { renderDeleteUser(user); }




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
        this.addItem("logoutDropdownBtn", "Déconnexion", "fa-sign-out", () => logout());
    }
    about() {
        this.addItem("aboutDropdownBtn", "À propos...", "fa-info-circle", () => renderAbout());
    }
    editProfile() {
        this.addItem("editProfileDropdownBtn", "Modifier le profil", "fa-user-edit", () => renderEditProfileForm());
    }
    listPictures() {
        this.addItem("listPicturesDrodownBtn", "Liste des photos", "fa-image", () => { contentScrollPosition = 0; filter = FilterType.none; renderPhotos(true) });
    }
    manageUsers() {
        this.addItem("managerUsersDropdownBtn", "Gestion des usagers", "fa-user-cog", () => manageUsers());
    }
    sortByDate() {
        this.addItem("sortByDateDropdownBtn", "Photos par date de création", "fa-calendar", () => { contentScrollPosition = 0; filter = FilterType.date; renderPhotos(true) }, filter === FilterType.date);
    }
    sortByOwners() {
        this.addItem("sortByOwnerDropdownBtn", "Photos par créateur", "fa-users", () => { contentScrollPosition = 0; filter = FilterType.owners; renderPhotos(true) }, filter === FilterType.owners);
    }
    sortByLikes() {
        this.addItem("sortByLikesDropdownBtn", "Photos les plus aimées", "fa-heart", () => { contentScrollPosition = 0; filter = FilterType.likes; renderPhotos(true) }, filter === FilterType.likes);
    }
    sortBySelf() {
        this.addItem("sortBySelfDropdownBtn", "Mes photos", "fa-user", () => { contentScrollPosition = 0; filter = FilterType.self; renderPhotos(true) }, filter === FilterType.self);
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

async function photosPeriodicalRefresh() {
    const result = await API.GetPhotosETag();
    if (result) {
        if (currentETag !== result)
            renderPhotos();
    } else {
        console.log("Error trying to refresh the page");
        console.log(API.currentHttpError);
    }
}