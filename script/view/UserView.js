import PeerView from "./PeerView.js";
import TorrentView from "./TorrentView.js";
import MarkerManagerView from "./MarkerManagerView.js";

class UserView extends Croquet.View {
    constructor(model, options = {}) {
        super(model);
        this.model = model;

        this.dateJoined = Date.now();

        const {crypto, viewId} = options;
        if(crypto) {
            this.crypto = crypto;
            this.login(viewId);
            
            this.subscribe(this.viewId, "send-message", this._message);
            this.subscribe(this.model.id, "receive-encrypted-message", this.openMessage);
            this.subscribe(this.model.id, "message", this.onmessage);
        }
        this.subscribe(this.model.id, "messaged", this.onmessaged);

        this.subscribe(this.model.id, "user-join", this.userJoin);
        this.subscribe(this.model.id, "user-exit", this.userExit);  

        this.subscribe(this.model.id, "user-unregister", this.unregistered);

        this.subscribe(this.model.id, "set-picture", this._setPicture);
        this.subscribe(this.model.id, "set-username", this._setUsername);
        this.subscribe(this.model.id, "set-position", this._setPosition);
        if(crypto) {
            this._updateCurrentPosition = true;
            this.subscribe(this.viewId, "map-update-position", this.updateCurrentPosition);

            this.subscribe(this.viewId, "get-picture", callback => callback(this.picture));
            this.subscribe(this.viewId, "set-picture", this.setPicture);

            this.subscribe(this.viewId, "get-position", callback => callback(this.position));
            this.subscribe(this.viewId, "set-position", this.setPicture);

            this.subscribe(this.viewId, "get-username", callback => callback(this.username));
            this.subscribe(this.viewId, "set-username", this.setUsername);
        }

        this.peer = new PeerView(model);

        this.client = new TorrentView(model);

        this.markerManager = new MarkerManagerView(model.markerManager, this);

        this.subscribe(this.viewId, "synced", this.synced);
    }

    synced() {
        if(this.model.picture)
            this._setPicture();
    }

    detach() {
        this.markerManager.detach();
        this.client.detach();
        this.peer.detach();

        // https://croquet.io/sdk/docs/View.html#detach
        super.detach();
    }

    login(viewId) {
        if(this.crypto) {
            this.publish(this.model.id, "view-join-request", this.crypto.sign({viewId}));
        }
    }
    unregister() {
        if(this.crypto) {
            this.publish(this.model.id, "user-unregister-request", this.crypto.sign());
        }
    }
    unregistered() {
        this.publish(this.viewId, "user-unregister", this);
    }

    message(object = {}) {
        this.publish(this.viewId, "send-message", {
            userModel : this.model,
            object,
        });
    }
    _message({userModel, object}) {
        if(this.crypto) {
            const {nonce, encryption} = this.crypto.encrypt(object, userModel.crypto.encryptionPublicKey);
            this.publish(userModel.id, "send-encrypted-message", {nonce, encryption, userModel : this.model});
        }
    }
    openMessage({encryption, nonce, userModel}) {
        if(this.crypto) {
            const object = this.crypto.decrypt(encryption, nonce, userModel.crypto.encryptionPublicKey);
            if(object) {
                this.publish(this.model.id, "message", {
                    userModel : userModel,
                    object,
                });
                this.publish(userModel.id, "messaged", {
                    userModel : this.model,
                    object,
                });
            }
        }
    }
    onmessage({userModel, object}) {
        
    }
    onmessaged({userModel, object}) {
        
    }

    userJoin() {
        this.publish(this.viewId, "user-join", this);
    }
    userExit() {
        this.publish(this.viewId, "user-exit", this);
    }

    setUsername(username) {
        if(this.crypto) {
            this.publish(this.model.id, "set-username-request", this.crypto.sign({username}));
        }
    }
    _setUsername() {
        this.publish(this.id, "set-username", this.username);
        if(this.crypto)
            this.publish(this.viewId, "update-username", this.username);
    }
    get username() {
        return this.model.username;
    }

    setPicture(file) {
        if(this.crypto) {
            this.client.seed(file, torrent => {
                const {magnetURI} = torrent;
                this.publish(this.model.id, "set-picture-request", this.crypto.sign({picture : magnetURI}));
            });
        }
    }
    _setPicture() {
        this.client.add(this.model.picture, torrent => {
            const {files} = torrent;
            this.picture = files[0];
            this.publish(this.id, "update-picture", this.picture);
            if(this.crypto) {
                this.publish(this.viewId, "update-picture", this.picture);
            }
        });
    }

    setPosition(position) {
        if(this.crypto) {
            this.publish(this.model.id, "set-position-request", this.crypto.sign({position}));
        }
    }
    _setPosition() {
        this.publish(this.id, "set-position", this.position);
        if(this.crypto) {
            this.publish(this.viewId, "update-position", this.position);
        }
    }
    get position() {
        return this.model.position;
    }

    updateCurrentPosition(position) {
        if(this._updateCurrentPosition)
            this.setPosition(position);
    }
}

export default UserView;