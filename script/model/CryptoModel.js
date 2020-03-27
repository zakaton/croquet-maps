const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

class CryptoModel extends Croquet.Model {
    init(options = {}) {
        super.init();
        const {nonces, encryptionPublicKey, signaturePublicKey} = options;

        this.nonces = nonces || this.wellKnownModel("CryptoModel").nonces || [];

        this.signaturePublicKey = new Uint8Array(signaturePublicKey);
        this.encryptionPublicKey = new Uint8Array(encryptionPublicKey);
    }

    // NONCE
    indexOfNonce(nonce) {
        // https://github.com/dchest/tweetnacl-js#naclverifyx-y
        return this.nonces.findIndex(_nonce => nacl.verify(nonce, _nonce));
    }
    isNonceUnique(nonce) {
        return (this.indexOfNonce(nonce) == -1);
    }
    createNonce() {
        let nonce;
        
        do {
            // https://github.com/dchest/tweetnacl-js#naclrandombyteslength
            nonce = nacl.randomBytes(nacl.box.nonceLength);
        }
        while(!this.isNonceUnique(nonce))
        
        return nonce;
    }

    // SIGNATURES
    hash(string, nonce) {
        const stringEncoding = textEncoder.encode(string + this.sessionId);

        const encoding = new Uint8Array(stringEncoding.length + nonce.length);
            encoding.set(stringEncoding);
            encoding.set(nonce, stringEncoding.length);
        
        // https://github.com/dchest/tweetnacl-js#naclhashmessage
        return nacl.hash(encoding);
    }
    verify({string, signedHash, nonce, signaturePublicKey = this.publicKeys.signature}) {
        if(this.isNonceUnique(nonce)) {
            this.nonces.push(nonce);
            
            // https://github.com/dchest/tweetnacl-js#naclsignopensignedmessage-publickey
            const hash = nacl.sign.open(signedHash, signaturePublicKey);
            if(hash) {

                // https://github.com/dchest/tweetnacl-js#naclverifyx-y
                const recreatedHash = this.hash(string, nonce);
                
                // https://github.com/dchest/tweetnacl-js#naclverifyx-y
                if(nacl.verify(hash, recreatedHash)) {
                    return JSON.parse(string);
                }
            }
        }
    }
}
CryptoModel.register();

export default CryptoModel;