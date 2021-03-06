import CryptoView from "./CryptoView.js";
import UserView from "./UserView.js";
import TorrentManagerView from "./TorrentManagerView.js";
import MapView from "./MapView.js";
import MapUIView from "./MapUIView.js";
import SpatialAudioManagerView from "./SpatialAudioManagerView.js";

class View extends Croquet.View {
    constructor(model) {
        super(model);
        this.model = model;
        this.crypto = new CryptoView(model.crypto);

        this.client = new TorrentManagerView(model);

        this.spatialAudioManager = new SpatialAudioManagerView(model);

        this.map = new MapView(model, {
            accessToken : 'pk.eyJ1IjoiemFrYXRvbiIsImEiOiJjazVoN2pxNjQwMHdyM25vZDFxbHl0cHJ6In0.jdS84m3f3cr4ZxHeSDUyBA',
        });

        this.users = [];
        model.users.forEach(userModel => this.userRegister(userModel));
        this.subscribe(this.sessionId, "user-register", this.userRegister);
        this.subscribe(this.viewId, "user-unregister", this.userUnregister);

        this.subscribe(this.viewId, "user-join", this.userJoin);
        this.subscribe(this.viewId, "user-exit", this.userExit);  

        // https://croquet.studio/sdk/docs/global.html#event:synced
        this.subscribe(this.viewId, "synced", this.synced);


        this.mapUI = new MapUIView(model);
    }

    register() {
        this.publish(this.sessionId, "user-register-request", this.crypto.sign({
            viewId : this.viewId,
            encryptionPublicKey : Array.from(this.crypto.encryptionKeyPair.publicKey),
        }));
    }

    isOwnUserModel(userModel) {
        // https://github.com/dchest/tweetnacl-js#naclverifyx-y
        return nacl.verify(userModel.crypto.signaturePublicKey, this.crypto.signatureKeyPair.publicKey);
    }
    get userIndex() {
        return this.users.indexOf(this.user);
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

    userJoin(user) {
        
    }
    userExit(user) {
        
    }

    synced() {
        console.log("synced");
        if(!this.user)
            this.register();
    }

    detach() {
        // https://croquet.io/sdk/docs/View.html#detach
        super.detach();
        
        this.users.forEach(user => user.detach());
        this.crypto.detach();
        this.map.detach();
        this.mapUI.detach();
        this.client.detach();
        this.spatialAudioManager.detach();
    }
}

export default View;