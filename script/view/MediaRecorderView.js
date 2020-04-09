class MediaRecorderView extends Croquet.View {
    constructor(model) {
        super(model);

        navigator.mediaDevices.getUserMedia({
            audio : true,
        }).then(stream => {
            this.stream = stream;
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.addEventListener("start", this.onstart.bind(this));
            this.mediaRecorder.addEventListener("dataavailable", this.ondataavailable.bind(this));
            this.mediaRecorder.addEventListener("stop", this.onstop.bind(this));

            this.subscribe(this.viewId, "media-recorder-start", this.start);
            this.subscribe(this.viewId, "media-recorder-stop", this.stop);
            this.subscribe(this.viewId, "media-recorder-get-state", callback => callback(this.mediaRecorder.state));
            this.subscribe(this.viewId, "media-recorder-get-audioBlob", callback => callback(this.audioBlob));
        });
    }

    onstart() {
        this.publish(this.viewId, "media-recorder-update-state", this.mediaRecorder.state);
        
        this.audioChunks.length = 0;
    }
    ondataavailable(event) {
        this.audioChunks.push(event.data);
    }
    onstop() {
        this.publish(this.viewId, "media-recorder-update-state", this.mediaRecorder.state);

        const audioBlob = new Blob(this.audioChunks);

        this.audioBlob = audioBlob;
        
        this.publish(this.viewId, "media-recorder-audioBlob", audioBlob);
    }

    start() {
        this.mediaRecorder.start();
    }
    stop() {
        this.mediaRecorder.stop();
    }

    detach() {
        super.detach();
    }
}

export default MediaRecorderView;