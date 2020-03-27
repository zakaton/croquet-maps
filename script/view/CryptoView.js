const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

class CryptoView extends Croquet.View {
    constructor(model, options = {}) {
        super(model);
        this.model = model;

        const {signatureKeyPair, encryptionKeyPair} = options;

        this.signatureKeyPair = signatureKeyPair || this.loadSignatureKeyPair();
        this.encryptionKeyPair = encryptionKeyPair || this.loadEncryptionKeyPair();
    }

    // https://github.com/dchest/tweetnacl-js#signatures
    loadSignatureKeyPair() {
        if(localStorage.getItem("signatureKeyPair") == null) {
            // https://github.com/dchest/tweetnacl-js#naclsignkeypair
            const keyPair = nacl.sign.keyPair();
            localStorage.setItem("signatureKeyPair", JSON.stringify({
                publicKey : Array.from(keyPair.publicKey),
                secretKey : Array.from(keyPair.secretKey),
            }));
            return keyPair;
        }
        else {
            const {publicKey, secretKey} = JSON.parse(localStorage.getItem("signatureKeyPair"));
            return {
                publicKey : new Uint8Array(publicKey),
                secretKey : new Uint8Array(secretKey),
            };
        }
    }

    sign(object = {}) {
        const string = JSON.stringify(object);

        const nonce = this.model.createNonce();
        const hash = this.model.hash(string, nonce);

        // https://github.com/dchest/tweetnacl-js#naclsignmessage-secretkey
        const signedHash = nacl.sign(hash, this.signatureKeyPair.secretKey);

        return {
            string,
            nonce, signedHash,
            signaturePublicKey : this.signatureKeyPair.publicKey,
        };
    }
    
    // https://github.com/dchest/tweetnacl-js/blob/master/README.md#public-key-authenticated-encryption-box
    loadEncryptionKeyPair() {
        if(localStorage.getItem("encryptionKeyPair") == null) {
            // https://github.com/dchest/tweetnacl-js/blob/master/README.md#naclboxkeypair
            const keyPair = nacl.box.keyPair();
            localStorage.setItem("encryptionKeyPair", JSON.stringify({
                publicKey : Array.from(keyPair.publicKey),
                secretKey : Array.from(keyPair.secretKey),
            }));
            return keyPair;
        }
        else {
            const {publicKey, secretKey} = JSON.parse(localStorage.getItem("encryptionKeyPair"));
            return {
                publicKey : new Uint8Array(publicKey),
                secretKey : new Uint8Array(secretKey),
            };
        }
    }

    encrypt(object, encryptionPublicKey) {
        const nonce = this.model.createNonce();
        const objectEncoding = textEncoder.encode(JSON.stringify(object));
        
        // https://github.com/dchest/tweetnacl-js#naclboxmessage-nonce-theirpublickey-mysecretkey
        const encryption = nacl.box(objectEncoding, nonce, encryptionPublicKey, this.encryptionKeyPair.secretKey);

        return {
            nonce, encryption
        };
    }
    decrypt(encryption, nonce, encryptionPublicKey) {
        // https://github.com/dchest/tweetnacl-js#naclboxopenbox-nonce-theirpublickey-mysecretkey
        const objectEncoding = nacl.box.open(encryption, nonce, encryptionPublicKey, this.encryptionKeyPair.secretKey);
        if(objectEncoding) {
            return JSON.parse(textDecoder.decode(objectEncoding));
        };
    }
}

export default CryptoView;
