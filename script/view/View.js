import CryptoView from "./CryptoView.js";
import UserView from "./UserView.js";

class View extends Croquet.View {
    constructor(model) {
        super(model);
        this.model = model;
        this.crypto = new CryptoView(model.crypto);

        this.users = [];
        model.users.forEach(userModel => this.userRegister(userModel));
        this.subscribe(this.sessionId, "user-register", this.userRegister);
        this.subscribe(this.viewId, "user-unregister", this.userUnregister);

        this.subscribe(this.viewId, "user-join", this.userJoin);
        this.subscribe(this.viewId, "user-exit", this.userExit);  

        // https://croquet.studio/sdk/docs/global.html#event:synced
        this.subscribe(this.viewId, "synced", this.synced);

        this.subscribe(this.viewId, "message-open", this.openMessage);
        this.subscribe(this.viewId, "message", this.onmessage);      
    }

    userJoin(user) {
        
    }
    userExit(user) {
        
    }

    synced() {
        console.log("synced");
        if(!this.user)
            this.register();
    }
    
    register() {
        console.log("registering self");
        this.publish(this.sessionId, "user-register-request", this.crypto.sign({
            viewId : this.viewId,
            encryptionPublicKey : Array.from(this.crypto.encryptionKeyPair.publicKey),
        }));
    }

    isOwnUserModel(userModel) {
        // https://github.com/dchest/tweetnacl-js#naclverifyx-y
        return nacl.verify(userModel.crypto.signaturePublicKey, this.crypto.signatureKeyPair.publicKey);
    }
    getUserByUserModel(userModel) {
        return this.users.find(user => user.model == userModel);
    }

    userRegister(userModel) {
        let user;
        if(this.isOwnUserModel(userModel)) {
            user = new UserView(userModel, this);
            this.user = user;
        }
        else {
            user = new UserView(userModel);
        }

        this.users.push(user);
    }
    userUnregister(user) {
        if(this.user == user)
            delete this.user;
        
        if(user)
            this.users.splice(this.users.indexOf(user), 1);
    }

    openMessage({object, fromUserModel, toUserModel}) {
        this.publish(this.viewId, "message", {
            object,
            fromUser : this.getUserByUserModel(fromUserModel),
            toUser : this.getUserByUserModel(toUserModel),
        });
    }
    onmessage({fromUser, toUser, object}) {
        console.log(fromUser, toUser, object);
    }
}

export default View;