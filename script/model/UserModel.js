import CryptoModel from "./CryptoModel.js";

class UserModel extends Croquet.Model {
    init(options = {}) {
        super.init();
        const {viewId} = options;

        this.viewId = viewId;
        this.crypto = CryptoModel.create(options);

        this.publish(this.sessionId, "user-register", this);
        this.subscribe(this.id, "user-unregister-request", this.unregister);

        this.subscribe(this.sessionId, "view-exit", this.exit);
        this.subscribe(this.id, "view-join-request", this.join);

        this.subscribe(this.id, "send-encrypted-message", this.onmessage);
    }

    get isOnline() {
        return Boolean(this.viewId);
    }
    join() {
        const object = this.crypto.verify(...arguments);
        if(object) {
            const {viewId} = object;
            this.viewId = viewId;
            this.publish(this.id, "user-join");
        }
    }
    exit(viewId) {
        if(this.viewId == viewId) {
            delete this.viewId;
            this.publish(this.id, "user-exit");
        }
    }
    
    unregister() {
        const object = this.crypto.verify(...arguments);
        if(object) {
            this.publish(this.id, "user-unregister", this);
            this.wellKnownModel("modelRoot").unregister(this);
        }
    }
    
    onmessage({nonce}) {
        if(this.crypto.isNonceUnique(nonce)) {
            this.crypto.nonces.push(nonce);
            this.publish(this.id, "receive-encrypted-message", ...arguments);
        }
    }
}
UserModel.register();

export default UserModel;