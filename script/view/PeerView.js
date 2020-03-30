class PeerView extends Croquet.View {
    constructor(model) {
        super(model);
        this.model = model;

        this.acceptingCalls = false;
        this.subscribe(this.model.id, "messaged", this.onmessage);
    }

    connect() {
        this.acceptingCalls = true;
        this.createPeer({
            initiator : true,
        });
    }

    createPeer(options) {
        if(this.acceptingCalls) {
            this.destroy();
    
            const _options = Object.assign({}, options, {
                trickle : false,
            });
    
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
                console.log(stream);
                this.publish(this.model.id, "peer-stream");
            });
    
            peer.on("connect", () => {
                console.log("connect");
                this.publish(this.model.id, "peer-connect");
            });
    
            peer.on("error", error => {
                console.error(error);
            });
    
            peer.on("close", () => {
                console.log("close");
                this.publish(this.model.id, "peer-close");
            });
    
            return peer;
        }
    }

    destroy() {
        if(this._peer) {
            // https://github.com/feross/simple-peer#peerdestroyerr
            this._peer.destroy();
            delete this._peer;
        }
    }
    onmessage({user, object}) {
        const {type} = object;
        if(type && type == 'peer') {
            const {data} = object;

            switch(data.type) {
                case "offer":
                    this.createPeer();
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
}

export default PeerView;