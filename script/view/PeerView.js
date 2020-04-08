class PeerView extends Croquet.View {
    constructor(model) {
        super(model);
        this.model = model;

        this.acceptingCalls = false;
        this.subscribe(this.model.id, "messaged", this.onmessage);  

        this.subscribe(this.model.id, "peer-set-accepting-calls", this._setAcceptingCalls);
        this.subscribe(this.model.id, "peer-set-stream-options", this._setStreamOptions);
        
        this.subscribe(this.model.id, "peer-connect-local", this._connect);
        this.subscribe(this.model.id, "peer-destroy-local", this._destroy);
        this.subscribe(this.model.id, "peer-add-stream-local", this._addStream);
    }

    _connect(options) {
        this.connect(options);
    }
    _destroy() {
        this.destroy();
    }
    _setAcceptingCalls(acceptingCalls) {
        this.acceptingCalls = acceptingCalls;
    }

    _setStreamOptions(streamOptions) {
        this.streamOptions = streamOptions;
    }

    connect(options = {}) {
        this.acceptingCalls = true;
        options.initiator = true;
        this.createPeer(options);
    }

    createPeer(options) {
        if(this.acceptingCalls) {
            this.destroy();
    
            const _options = Object.assign({}, options, {
                trickle : false,
            });

            return new Promise((resolve, reject) => {
                if(this.streamOptions) {
                    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
                    navigator.mediaDevices.getUserMedia(this.streamOptions)
                        .then(stream => {
                            console.log("STREAM");
                            _options.stream = stream;
                            resolve();
                        });
                }
                else
                    resolve();

            }).then(() => {
                // https://github.com/feross/simple-peer#peer--new-peeropts
                const peer = this._peer = new SimplePeer(_options);
        
                // https://github.com/feross/simple-peer#peeronsignal-data--
                peer.on("signal", data => {
                    this.publish(this.viewId, "send-message", {
                        userModel : this.model,
                        object : {
                            type : 'peer',
                            data,
                        },
                    });
                });
        
                peer.on("stream", stream => {
                    console.log("stream");
                    this.publish(this.model.id, "peer-stream", {peer, stream});
                });
        
                peer.on("connect", () => {
                    console.log("connect");
                    this.publish(this.model.id, "peer-connect", peer);
                });
        
                peer.on("error", error => {
                    console.error(error);
                });
        
                peer.on("close", () => {
                    console.log("close");
                    this.publish(this.model.id, "peer-close", peer);
                });
        
                return peer;
            });        
        }
        else return new Promise((resolve, reject) => resolve());
    }

    destroy() {
        if(this._peer) {
            // https://github.com/feross/simple-peer#peerdestroyerr
            this._peer.destroy();
            delete this._peer;
        }
    }
    onmessage({userModel, object}) {
        const {type} = object;
        if(type && type == 'peer') {
            const {data} = object;

            switch(data.type) {
                case "offer":
                    this.createPeer().then(() => this.signal(data));
                    return;
                    break;
                case "answer":
                    break;
                case "negotiate":
                    break;
                default:
                    break;
            }

            this.signal(data);
        }
    }
    signal(data) {
        if(this._peer) {
            // https://github.com/feross/simple-peer#peersignaldata
            this._peer.signal(data);
        }
    }
    addStream(stream) {
        if(this._peer && this._peer.connected) {
            // https://github.com/feross/simple-peer#peeraddstreamstream
            this._peer.addStream(stream);
        }
    }
    _addStream({stream}) {
        this.addStream(stream);
    }
}

export default PeerView;