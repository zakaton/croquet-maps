/*
    TODO
        Resonance Audo Crap
        Add Audio or Video element
*/

const AudioContext = window.AudioContext || window.webkitAudioContext;

class SpatialAudioManager extends Croquet.View {
    constructor(model) {
        super(model);

        // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
        this.audioContext = new AudioContext();

        // https://resonance-audio.github.io/resonance-audio/reference/web/ResonanceAudio.html
        this.scene = new ResonanceAudio(this.audioContext)
        // https://resonance-audio.github.io/resonance-audio/reference/web/ResonanceAudio.html#output
        this.scene.output.connect(this.audioContext.destination);

        this.subscribe(this.viewId, "new-marker", this.addMarker);

        this.sources = new Map(); // markerView => source
    }

    addMarker(marker) {
        this.subscribe(marker.id, "update-source", _ => {
            const {video, audio} = _;

            if(this.sources.has(marker)) {
                // remove existing source
            }

            // https://resonance-audio.github.io/resonance-audio/reference/web/ResonanceAudio.html#createSource
            const source = this.scene.createSource();

            let mediaSource;
            if(audio) {
                mediaSource = this.audioContext.createMediaElementSource(audio);
            }
            else if(video) {
                mediaSource = this.audioContext.createMediaElementSource(video);
                //video.muted = true;
            }

            mediaSource.connect(source.input);

            this.sources.set(marker, {video, audio, source, mediaSource});
        });

        this.subscribe(marker.id, "update-position", _ => {
            // https://resonance-audio.github.io/resonance-audio/reference/web/Source.html#setPosition
        });

        this.subscribe(marker.id, "remove-marker", () => {
            if(this.sources.has(marker)) {
                // remove source
            }
        });
    }

    updatePosition(marker) {
        // update this crap
    }

    detach() {
        this.audioContext.close();
        super.detach();
    }
}

export default SpatialAudioManager;