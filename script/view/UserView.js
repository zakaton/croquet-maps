import PeerView from "./PeerView.js";
import TorrentView from "./TorrentView.js";

class UserView extends Croquet.View {
    constructor(model, options = {}) {
        super(model);
        this.model = model;

        this.peer = new PeerView(model);
        this.client = new TorrentView();

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
}

export default UserView;