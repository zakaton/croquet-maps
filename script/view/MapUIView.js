import TorrentView from "./TorrentView.js";

class MapUIView extends Croquet.View {
    constructor(model) {
        super(model);

        this.client = new TorrentView(model);

        // https://docs.mapbox.com/mapbox-gl-js/api/#marker
        this.marker = new mapboxgl.Marker();
        // https://docs.mapbox.com/mapbox-gl-js/api/#marker#setlnglat
        this.marker.setLngLat([0, 0])
        this.publish(this.viewId, "add-marker", this.marker);

        this.eventListeners = [];

        this.usernameSpan = document.querySelector(`span[data-ui="username"]`);
        this.subscribe(this.viewId, "update-username", this.updateUsername);
        this.getUsername(username => this.updateUsername(username));

        this.usernameInput = document.querySelector(`input[data-ui="username"]`);
        this.usernameButton = document.querySelector(`button[data-ui="username"]`);
        this.addEventListener(this.usernameButton, "click", this.onUsernameButtonClick.bind(this));

        this.pictureImage = document.querySelector(`img[data-ui="picture"]`);
        this.pictureInput = document.querySelector(`input[data-ui="picture"]`);
        this.addEventListener(this.pictureInput, "input", this.onPictureInput.bind(this));
        this.pictureButton = document.querySelector(`button[data-ui="picture"]`);
        this.addEventListener(this.pictureButton, "click", this.onPictureButtonClick.bind(this));

        this.longitudeSpan = document.querySelector(`span[data-ui="longitude"]`);
        this.latitudeSpan = document.querySelector(`span[data-ui="latitude"]`);
        this.subscribe(this.viewId, "map-update-position", this.onMapUpdate);

        this.trackingButton = document.querySelector(`button[data-ui="tracking"]`);
        this.subscribe(this.viewId, "map-update-watch", this.onWatchUpdate);
        this.addEventListener(this.trackingButton, "click", this.onTrackingButtonClick.bind(this));

        this.bearingInputRange = document.querySelector(`input[type="range"][data-ui="bearing"]`);
        this.bearingInputNumber = document.querySelector(`input[type="number"][data-ui="bearing"]`);
        this.subscribe(this.viewId, "map-update-bearing", this.onBearingUpdate);
        this.addEventListener(this.bearingInputRange, "input", this.onBearingInput.bind(this));
        this.addEventListener(this.bearingInputNumber, "input", this.onBearingInput.bind(this));

        this.longitudeInput = document.querySelector(`input[data-ui="longitude"]`);
        this.latitudeInput = document.querySelector(`input[data-ui="latitude"]`);
        this.fakeLocationButton = document.querySelector(`button[data-ui="fakeLocation"]`);
        this.addEventListener(this.fakeLocationButton, "click", this.onFakeLocationButton.bind(this));
        this.subscribe(this.viewId, "map-click", this.onclick);

        this.commentMarkerTextarea = document.querySelector(`textarea[data-ui="commentMarker"]`);
        this.commentMarkerButton = document.querySelector(`button[data-ui="commentMarker"]`);
        this.addEventListener(this.commentMarkerButton, "click", this.onCommentMarkerButtonClick.bind(this));

        this.pictureMarkerImage = document.querySelector(`img[data-ui="pictureMarker"]`);
        this.pictureMarkerInput = document.querySelector(`input[data-ui="pictureMarker"]`);
        this.addEventListener(this.pictureMarkerInput, "input", this.onPictureMarkerInput.bind(this));
        this.pictureMarkerButton = document.querySelector(`button[data-ui="pictureMarker"]`);
        this.addEventListener(this.pictureMarkerButton, "click", this.onPictureMarkerButtonClick.bind(this))

        this.videoMarkerVideo = document.querySelector(`video[data-ui="videoMarker"]`);
        this.videoMarkerInput = document.querySelector(`input[data-ui="videoMarker"]`);
        this.addEventListener(this.videoMarkerInput, "input", this.onVideoMarkerInput.bind(this));
        this.videoMarkerButton = document.querySelector(`button[data-ui="videoMarker"]`);
        this.addEventListener(this.videoMarkerButton, "click", this.onVideoMarkerButtonClick.bind(this))
    }

    addEventListener(element, type, listener) {
        element.addEventListener(type, listener);
        this.eventListeners.push({element, type, listener});
    }

    setUsername(username) {
        this.publish(this.viewId, "set-username", username);
    }
    getUsername(callback) {
        this.publish(this.viewId, "get-username", callback);
    }
    updateUsername(username) {
        this.usernameSpan.innerText = username;
    }


    setPicture(file) {

    }
    getPicture(callback) {
        this.publish(this.viewId, "get-picture", callback);
    }
    updatePicture(picture) {

    }

    setPosition(position) {
        
    }
    getPosition(callback) {
        this.publish(this.viewId, "get-position", callback);
    }

    onMapUpdate(position) {
        const {longitude, latitude} = position;

        this.latitudeSpan.innerText = latitude;
        this.longitudeSpan.innerText = longitude;
    }
    onTrackingButtonClick() {
        this.publish(this.viewId, "map-get-watch", watching => {
            this.publish(this.viewId, "map-set-watch", !watching);
        });
    }
    onWatchUpdate(watching) {
        this.trackingButton.innerText = watching?
            "Stop Tracking":
            "Start Tracking";
    }

    onBearingUpdate(bearing) {
        this.bearingInputNumber.value = this.bearingInputRange.value = bearing;
    }
    onBearingInput() {
        this.publish(this.viewId, "map-set-bearing", this.bearingInputRange.value);
    }

    // https://croquet.io/sdk/docs/View.html#detach
    detach() {
        this.usernameSpan.innerText = '';        

        this.eventListeners.forEach(function({element, type, listener}) {
            element.removeEventListener(type, listener);
        });

        super.detach();
    }

    onUsernameButtonClick() {
        const username = this.usernameInput.value;
        if(username.length > 0) {
            this.setUsername(username);
            this.usernameInput.value = '';
        }
    }

    onPictureInput() {
        const {files} = this.pictureInput;
        const file = files[0];
        if(file) {
            this.getFileSrc(file, src => {
                this.pictureImage.src = src;
            });
        }
    }
    onPictureButtonClick() {
        if(this.pictureInput.files.length > 0)
            this.publish(this.viewId, "set-picture", this.pictureInput.files[0]);
    }



    onFakeLocationButton() {
        this.publish(this.viewId, "map-set-watch", false);

        const position = {
            longitude : this.longitudeInput.value,
            latitude : this.latitudeInput.value,
        };
        this.publish(this.viewId, "map-update-position", position);

        this.longitudeInput.value = '';
        this.latitudeInput.value = '';
        delete this.position;
    }
    onclick({longitude, latitude}) {
        this.position = {longitude, latitude};

        this.longitudeInput.value = longitude;
        this.latitudeInput.value = latitude;

        // https://docs.mapbox.com/mapbox-gl-js/api/#marker#setlnglat
        this.marker.setLngLat([longitude, latitude]);
    }

    onCommentMarkerButtonClick() {
        const comment = this.commentMarkerTextarea.value;
        if(comment.length > 0 && this.position) {
            this.publish(this.viewId, "create-marker-request", {
                position : this.position,
                comment,
                type : "comment",
            });
            this.commentMarkerTextarea.value = '';
        }
    }

    onPictureMarkerInput() {
        const {files} = this.pictureMarkerInput;
        const file = files[0];
        if(file) {
            this.getFileSrc(file, src => {
                this.pictureMarkerImage.src = src;
            });
        }
    }
    onPictureMarkerButtonClick() {
        const {files} = this.pictureMarkerInput;
        const file = files[0];
        if(file && this.position) {
            this.client.seed(file, torrent => {
                const {magnetURI} = torrent;
                this.publish(this.viewId, "create-marker-request", {
                    position : this.position,
                    magnetURI,
                    type : "picture",
                });
                
                this.pictureMarkerImage.src = '';
                this.pictureMarkerInput.value = '';
            });
        }
    }

    onVideoMarkerInput() {
        const {files} = this.videoMarkerInput;
        const file = files[0];
        if(file) {
            this.getFileSrc(file, src => {
                this.videoMarkerVideo.src = src;
            });
        }
    }
    onVideoMarkerButtonClick() {
        const {files} = this.videoMarkerInput;
        const file = files[0];
        if(file && this.position) {
            this.client.seed(file, torrent => {
                const {magnetURI} = torrent;
                this.publish(this.viewId, "create-marker-request", {
                    position : this.position,
                    magnetURI,
                    type : "video",
                });
                
                this.videoMarkerVideo.src = '';
                this.videoMarkerInput.value = '';
            });
        }
    }

    getFileSrc(file, callback) {
        // https://developer.mozilla.org/en-US/docs/Web/API/FileReader
        const fileReader = new FileReader();

        // https://developer.mozilla.org/en-US/docs/Web/API/FileReader/load_event
        fileReader.addEventListener("load", event => {
            callback(event.target.result);
        });

        // https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
        fileReader.readAsDataURL(file);
    }
}

export default MapUIView;