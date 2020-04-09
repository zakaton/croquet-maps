const AudioContext = window.AudioContext || window.webkitAudioContext;

class SpatialAudioManagerView extends Croquet.View {
    constructor(model) {
        super(model);

        // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
        this.audioContext = new AudioContext();

        window.addEventListener("click", event => {
            if(this.audioContext.state !== "closed")
                this.audioContext.resume();
        }, {once: true});

        // https://resonance-audio.github.io/resonance-audio/reference/web/ResonanceAudio.html
        this.scene = new ResonanceAudio(this.audioContext)
        // https://resonance-audio.github.io/resonance-audio/reference/web/ResonanceAudio.html#output
        this.scene.output.connect(this.audioContext.destination);

        this.subscribe(this.viewId, "new-marker", this.addMarker);

        this.sources = new Map(); // markerView => source

        this.subscribe(this.viewId, "update-position", this.updatePositions);
        this.subscribe(this.viewId, "map-update-bearing", this.updatePositions);
    }

    addMarker(marker) {
        this.subscribe(marker.id, "update-source", _ => {
            let {video, audio, stream} = _;

            this.removeMarker(marker);

            // https://resonance-audio.github.io/resonance-audio/reference/web/ResonanceAudio.html#createSource
            const source = this.scene.createSource();

            let mediaSource;
            if(audio) {
                mediaSource = this.audioContext.createMediaElementSource(audio);
            }
            else if(video) {
                mediaSource = this.audioContext.createMediaElementSource(video);
            }
            else if(stream) {
                mediaSource = this.audioContext.createMediaStreamSource(stream);
                audio = document.createElement('audio');
                audio.srcObject = stream;
            }

            mediaSource.connect(source.input);
            this.sources.set(marker, {stream, video, audio, source, mediaSource});
            
            this.updatePosition(marker);
        });

        this.subscribe(marker.id, "update-position", _ => {
            this.updatePosition(marker);
        });

        this.subscribe(marker.id, "remove-marker", () => {
            this.removeMarker(marker);
        });
    }

    removeMarker(marker) {
        if(this.sources.has(marker)) {
            const {video, stream, audio, source, mediaSource} = this.sources.get(marker);
            mediaSource.disconnect();
            this.sources.delete(marker);
        }
    }

    degreesToRadians(degrees) {
        return (degrees/360) * (2*Math.PI);
    }
    radiansToDegrees(radians) {
        return (radians/(2*Math.PI)) * 360;
    }

    updatePosition(marker) {
        if(this.sources.has(marker)) {
            // https://docs.mapbox.com/mapbox-gl-js/api/#marker#getlnglat
            if(marker.marker.getLngLat()) {
                this.getPositon(marker, position => {
                    const {x, y, z} = position;
                    const {source} = this.sources.get(marker);
                    
                    // https://resonance-audio.github.io/resonance-audio/reference/web/Source.html#setPosition
                    source.setPosition(x, y, z);
                });
            }
        }
    }

    updatePositions() {
        this.sources.forEach((_, marker) => {
            this.updatePosition(marker);
        });
    }

    getVector(marker, callback) {
        // https://docs.mapbox.com/mapbox-gl-js/api/#marker#getlnglat
        if(marker.marker.getLngLat()) {
            this.publish(this.viewId, "get-position", position => {
                const lngLat = marker.marker.getLngLat();
                const to = [lngLat.lng, lngLat.lat];
                
                // https://turfjs.org/docs/#distance
                const distance = turf.distance([position.longitude, position.latitude], to);
                // https://turfjs.org/docs/#bearing
                const bearing = turf.bearing([position.longitude, position.latitude], to);

                this.publish(this.viewId, "map-get-bearing", _bearing => {
                    const vector = {
                        angle : bearing - _bearing,
                        magnitude : distance,
                    };

                    callback(vector);
                });
            });
        }
    }

    getPositon(marker, callback) {
        if(marker.marker.getLngLat()) {
            this.getVector(marker, vector => {
                const {angle, magnitude} = vector;
                const radians = this.degreesToRadians(-angle+90);
                const position = {
                    x : Math.cos(radians),
                    y : 0,
                    z : Math.sin(radians),
                }
                callback(position);
            });
        }
    }

    detach() {
        this.sources.forEach(_ => {
            const {mediaSource} = _;
            mediaSource.disconnect();
        });
        this.audioContext.close();
        super.detach();
    }
}

export default SpatialAudioManagerView;