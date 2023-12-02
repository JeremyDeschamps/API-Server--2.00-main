let contentScrollPosition = 0;
initUI();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Views rendering
function initUI() {
    initHeader("Connexion");
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
                <div class="dropdown-menu noselect">
                    <div class="dropdown-item" id="loginCmd">
                        <i class="menuIcon fa fa-sign-in mx-2"></i> Connexion
                    </div>
                    <div class="dropdown-divider"></div>

                    <div class="dropdown-item" id="aboutCmd">
                        <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
                    </div>
                </div>
            </div>

        `));
        return;
    }
}
function updateHeader(text, updateType = "default") {
    $("#viewTitle").text(text);


}

function renderAbout() {
    timeout();
    saveContentScrollPosition();
    eraseContent();
    updateHeader("À propos...", "about");

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

function renderLoginForm(loginMessage = "", email = "", emailError = "", passwordError = "") {

    updateHeader("Connexion");
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
        const result = await API.login(login.Email, login.Password);
        if (result)
        {
            // TODO: Change to content
            renderAbout();
        }
        else
        {
            const errorMessage = API.currentHttpError;
            const status = API.currentStatus;
            if (status === 481)
                renderLoginForm("", login.Email, errorMessage);
            else if (status === 482)
                renderLoginForm("", login.Email, "", errorMessage);
            else
            {
                //TODO: render problem
                updateHeader("Problème");
                renderErrorMessage("Le serveur ne répond pas");
            }
        }
    });
}

function renderPhotos() {
    eraseContent();
    $("#content").append("<p>Main page</p>");
}

function renderSignUpForm() {
    noTimeout(); // ne pas limiter le temps d’inactivité
    eraseContent(); // effacer le conteneur #content
    UpdateHeader("Inscription", "createProfile"); // mettre à jour l’entête et menu
    $("#newPhotoCmd").hide(); // cammoufler l’icone de commande d’ajout de photo
    const loggedUser = API.retrieveLoggedUser();
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
    <a href="confirmDeleteProfil.php">
    <button class="form-control btn-warning">Effacer le compte</button>
    </a>
    </div>
    `);
    $('#loginCmd').on('click', renderLoginForm); // call back sur clic
    initFormValidation();
    initImageUploaders();
    $('#abortCmd').on('click', renderLoginForm); // call back sur clic
    // ajouter le mécanisme de vérification de doublon de courriel

    addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
    // call back la soumission du formulaire
    $('#createProfilForm').on("submit", function (event) {
        let profil = getFormData($('#createProfilForm'));

        delete profil.matchedPassword;
        delete profil.matchedEmail;

        event.preventDefault();// empêcher le fureteur de soumettre une requête de soumission
        showWaitingGif(); // afficher GIF d’attente
        createProfil(profil); // commander la création au service API
    });

}
function renderErrorMessage(errorMessage = "") {
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
