import CryptoModel from "./CryptoModel.js";
import MarkerModel from "./MarkerModel.js";

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

        this.markers = [];
        this.subscribe(this.id, "create-marker-request", this.createMarker);
        this.subscribe(this.id, "remove-marker-request", this.removeMarker);
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

    createMarker() {
        const object = this.crypto.verify(...arguments);
        if(object) {
            Object.assign(object, {crypto : this.crypto});
            const marker = new MarkerModel(object);
            this.markers.push(marker);
            this.publish(this.id, "create-marker", marker);
        }
    }
    removeMarker() {
        const object = this.crypto.verify(...arguments);
        if(object) {
            const {marker} = object;
            this.markers.splice(this.markers.indexOf(marker), 1);
            this.publish(this.id, "remove-marker", marker);
        }
    }
}
UserModel.register();

export default UserModel;