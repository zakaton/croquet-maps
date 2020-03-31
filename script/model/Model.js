import CryptoModel from "./CryptoModel.js";
import UserModel from "./UserModel.js";

class Model extends Croquet.Model {
    init() {
        super.init();
        
        this.crypto = CryptoModel.create({}, "RootCryptoModel");
        this.users = [];

        this.subscribe(this.sessionId, "user-register-request", this.register);
    }

    register({signaturePublicKey}) {
        const object = this.crypto.verify(...arguments);
        if(object) {
            const {viewId, encryptionPublicKey} = object;
            const userModel = UserModel.create({viewId, encryptionPublicKey, signaturePublicKey});
            this.users.push(userModel);
        }
    }
    unregister(user) {
        this.users.splice(this.users.indexOf(user), 1);
    }
}
Model.register();

export default Model;