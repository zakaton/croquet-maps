class UserView extends Croquet.View {
    constructor(model, options = {}) {
        super(model);
        this.model = model;

        const {crypto, viewId} = options;
        if(crypto) {
            this.crypto = crypto;
            this.login(viewId);
            
            this.subscribe(this.model.id, "message-receive", this.openMessage);
        }

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

    message(user, object = {}) {
        if(this.crypto) {
            const {nonce, encryption} = this.crypto.encrypt(object, user.model.crypto.encryptionPublicKey);
            this.publish(user.model.id, "message-send", {nonce, encryption, userModel : this.model});
        }
    }
    openMessage({encryption, nonce, userModel}) {
        if(this.crypto) {
            const object = this.crypto.decrypt(encryption, nonce, userModel.crypto.encryptionPublicKey);
            if(object) {
                this.publish(this.viewId, "message-open", {
                    fromUserModel : userModel,
                    toUserModel : this.model,
                    object,
                });
            }
        }
    }

    userJoin() {
        this.publish(this.viewId, "user-join", this);
    }
    userExit() {
        this.publish(this.viewId, "user-exit", this);
    }
}

export default UserView;