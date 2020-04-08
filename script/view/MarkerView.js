/*
    TODO
        Rotate
        Draggable for original users
        ability to remove markers
        update username
        stylize markers to show picture and uername at the top
        show/hide only markers by selected user
        jump to user's user marker?
*/

import TorrentView from "./TorrentView.js";

class MarkerView extends Croquet.View {
    constructor(model, manager) {
        super(model);

        this.client = new TorrentView();

        this.model = model;
        this.manager = manager;
        this.user = manager.user;

        this.subscribe(this.model.id, "remove-marker", this._removed);
        this.subscribe(this.model.id, "set-position", this._setPosition);

        this._setProfilePicture();
        this.subscribe(this.user.id, "update-picture", this._setProfilePicture);
        
        this.subscribe(this.user.id, "set-username", this._setUsername);

        this.markerElement = document.createElement('div');
        this.popupElement = document.createElement('div');

        switch(this.model.type) {
            case "user":
                this.popupElement.innerHTML = `
                    <p>
                        <span data-username>${this.user.model.username || "anonymous"}</span>
                    </p>
                `;

                if(!this.user.crypto) {
                    this.popupElement.innerHTML += `
                        <button data-call="start">Start Call</button>

                        <button style="display:none;" data-call="accept">Accept</button>
                        <button style="display:none;" data-call="reject">Reject</button>

                        <button style="display:none;" data-call="end">End Call</button>
                    `;

                    const startCallButton = this.popupElement.querySelector(`button[data-call="start"]`);
                    const acceptCallButton = this.popupElement.querySelector(`button[data-call="accept"]`);
                    const rejectCallButton = this.popupElement.querySelector(`button[data-call="reject"]`);
                    const endCallButton = this.popupElement.querySelector(`button[data-call="end"]`);

                    this.subscribe(this.user.model.id, "peer-connect", peer => {
                        
                    });
                    this.subscribe(this.user.model.id, "peer-close", peer => {
                        
                    });
                    this.subscribe(this.user.model.id, "peer-stream", _ => {
                        const {peer, stream} = _;
                        const audio = document.createElement('audio');
                        audio.srcObject = stream;
                        audio.play();

                        this.publish(this.id, "update-source", {audio});
                    });

                    startCallButton.addEventListener("click", event => {
                        this.publish(this.user.model.id, "peer-set-stream-options", {audio:true});
                        this.publish(this.user.model.id, "peer-accepting-calls", true);
                        this.publish(this.viewId, "send-message", {
                            userModel : this.user.model,
                            object : {
                                type : 'call-request',
                            },
                        });
                    });

                    this.subscribe(this.user.model.id, "messaged", message => {
                        const {userModel, object} = message;
                        const {type} = object;
                        
                        switch(type) {
                            case "call-request":
                                startCallButton.style.display = 'none';
                                acceptCallButton.style.display = rejectCallButton.style.display = 'block';
                                endCallButton.style.display = 'none';

                                // https://docs.mapbox.com/mapbox-gl-js/api/#popup#isopen
                                if(!this.popup.isOpen()) {
                                    // https://docs.mapbox.com/mapbox-gl-js/api/#marker#togglepopup
                                    this.marker.togglePopup();
                                }
                                const lngLat = this.marker.getLngLat();
                                const position = {
                                    longitude : lngLat.lng,
                                    latitude : lngLat.lat,
                                };
                                this.publish(this.viewId, "set-center", position);
                                this.publish(this.viewId, "set-zoom", 17);
                                break;
                            case "accept-call":
                                startCallButton.style.display = 'none';
                                acceptCallButton.style.display = rejectCallButton.style.display = 'none';
                                endCallButton.style.display = 'block';

                                this.publish(this.user.model.id, "peer-connect-local");
                                break;
                            case "reject-call":
                                startCallButton.style.display = 'none';
                                acceptCallButton.style.display = rejectCallButton.style.display = 'none';
                                endCallButton.style.display = 'block';
                                break;
                            case "end-call":
                                startCallButton.style.display = 'block';
                                acceptCallButton.style.display = rejectCallButton.style.display = 'none';
                                endCallButton.style.display = 'none';
                                break;
                            default:
                                break;
                        }
                    });

                    acceptCallButton.addEventListener("click", event => {
                        startCallButton.style.display = 'none';
                        acceptCallButton.style.display = rejectCallButton.style.display = 'none';
                        endCallButton.style.display = 'block';

                        this.publish(this.user.model.id, "peer-set-stream-options", {audio:true});
                        this.publish(this.user.model.id, "peer-set-accepting-calls", true);
                        this.publish(this.viewId, "send-message", {
                            userModel : this.user.model,
                            object : {
                                type : 'accept-call',
                            },
                        });
                    });
                    rejectCallButton.addEventListener("click", event => {
                        startCallButton.style.display = 'none';
                        acceptCallButton.style.display = rejectCallButton.style.display = 'none';
                        endCallButton.style.display = 'block';

                        this.publish(this.user.model.id, "peer-set-accepting-calls", false);
                        this.publish(this.viewId, "send-message", {
                            userModel : this.user.model,
                            object : {
                                type : 'reject-call',
                            },
                        });
                    });

                    endCallButton.addEventListener("click", event => {
                        startCallButton.style.display = 'block';
                        acceptCallButton.style.display = rejectCallButton.style.display = 'none';
                        endCallButton.style.display = 'none';

                        this.publish(this.user.model.id, "peer-destroy-local");
                        this.publish(this.viewId, "send-message", {
                            userModel : this.user.model,
                            object : {
                                type : 'end-call',
                            },
                        });
                    });
                }
                this.markerElement = document.createElement('img');
                this._setProfilePicture();
                
                this.subscribe(this.user.id, "set-position", this._setPosition);
                break;
            case "picture":
                const image = document.createElement("img");
                image.width = 200;

                this.popupElement.appendChild(image);
                this.client.add(this.model.picture, torrent => {
                    const file = torrent.files[0];
                    // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#filerendertoelem-opts-function-callback-err-elem--browser-only
                    file.renderTo(image);
                });
                this.markerElement.innerText = '🖼️';
                break;
            case "audio":
                const audio = document.createElement("audio");
                this.popupElement.appendChild(audio);
                this.client.add(this.model.video, torrent => {
                    const file = torrent.files[0];
                    // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#filerendertoelem-opts-function-callback-err-elem--browser-only
                    file.renderTo(audio, (error, audio) => {
                        if(error)
                            console.error(error);
                        else
                            this.publish(this.id, "update-source", {audio});
                    });
                });
                this.markerElement.innerText = '📻';
                break;
            case "video":
                const video = document.createElement('video');
                video.controls = true;
                video.width = 200;
                this.popupElement.appendChild(video);
                this.client.add(this.model.video, torrent => {
                    const file = torrent.files[0];
                    // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#filerendertoelem-opts-function-callback-err-elem--browser-only
                    file.renderTo(video, (error, video) => {
                        if(error)
                            console.error(error)
                        else
                            this.publish(this.id, "update-source", {video});
                    });
                });
                this.markerElement.innerText = '📺';
                break;
            case "comment":
                this.popupElement.innerText = model.comment;
                this.markerElement.innerText = '💬';
                break;
            default:
                break;
        }

        this.markerElement.dataset.marker = this.type;
        this.popupElement.dataset.popup = this.type;

        // https://docs.mapbox.com/mapbox-gl-js/api/#marker
        this.marker = new mapboxgl.Marker(this.markerElement);
        
        // https://docs.mapbox.com/mapbox-gl-js/api/#popup
        this.popup = new mapboxgl.Popup({offset : 25});

        // https://docs.mapbox.com/mapbox-gl-js/api/#popup#setdomcontent
        this.popup.setDOMContent(this.popupElement);

        // https://docs.mapbox.com/mapbox-gl-js/api/#marker#setpopup
        this.marker.setPopup(this.popup);

        if(model.position) {
            // https://docs.mapbox.com/mapbox-gl-js/api/#marker#setlnglat
            this.marker.setLngLat([model.position.longitude, model.position.latitude]);
        }
        else
            this.marker.setLngLat([0, 0]);

        this.add();
        this.publish(this.viewId, "new-marker", this);
    }

    get type() {
        return this.model.type;
    }

    detach() {
        this.marker.remove();

        // https://croquet.io/sdk/docs/View.html#detach
        super.detach();
    }

    add() {
        this.publish(this.viewId, "add-marker", this.marker);
    }
    remove() {
        if(this.user.crypto) {
            this.publish(this.model.id, "remove-marker-request", this.user.crypto.sign());
        }
    }
    _removed() {
        this.marker.remove();
        this.publish(this.user.id, "remove-marker", this);
        this.publish(this.id, "remove-marker");
    }

    setPosition(position) {
        if(this.user.crypto) {
            this.publish(this.model.id, "set-position-request", this.user.crypto.sign({position}));
        }
    }
    _setPosition() {
        this.marker.setLngLat([this.model.position.longitude, this.model.position.latitude]);
        this.publish(this.id, "update-position");
    }

    _setUsername() {
        this.popupElement.querySelectorAll("span[data-username]").forEach(span => {
            span.innerText = this.user.username;
        });
    }
    _setProfilePicture() {
        if(this.user.picture) {
            if(this.type == "user" && this.user.picture)
                this.user.picture.renderTo(this.markerElement);
        }
    }
}

export default MarkerView;