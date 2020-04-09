class MapView extends Croquet.View {
    constructor(model, options = {}) {
        super(model);

        options.container =  options.container ||  document.createElement("div");
        options.style = options.style || 'mapbox://styles/mapbox/streets-v11';
        options.zoom = 10;

        this.markers = [];
        
        // https://docs.mapbox.com/mapbox-gl-js/api/#map
        this._map = new mapboxgl.Map(options);
        {
            const mapElement = document.getElementById("map");
            mapElement.innerHTML = '';
            mapElement.appendChild(this._map._container);
            
            // https://docs.mapbox.com/mapbox-gl-js/api/#map#resize
            this._map.resize();
        }

        // https://docs.mapbox.com/mapbox-gl-js/api/#map#on
        this._map.on('load', this.onload.bind(this));
        this._map.on('click', this.onclick.bind(this));

        this.subscribe(this.viewId, "set-center", this.setCenter);
        this.subscribe(this.viewId, "set-zoom", this.setZoom);

        this._centerAtCurrentLocation = true;
        this.subscribe(this.viewId, "map-update-position", this.centerAtCurrentLocation);
        this.watchPosition();

        this.subscribe(this.viewId, "add-marker", this.addMarker);

        this.subscribe(this.viewId, "map-get-position", callback => callback(this.position));

        this.subscribe(this.viewId, "map-set-watch", this.setWatch);
        this.subscribe(this.viewId, "map-get-watch", callback => callback(this.watchPositionId !== undefined));

        this.subscribe(this.viewId, "map-set-bearing", this.setBearing);
        // https://docs.mapbox.com/mapbox-gl-js/api/#map#getbearing
        this.subscribe(this.viewId, "map-get-bearing", callback => callback(this._map.getBearing()));

        this.watchingBearing = false;
        //this.watchBearing();
        this.subscribe(this.viewId, "map-set-bearing-watch", this.setBearingWatch);
        this.subscribe(this.viewId, "map-get-bearing-watch", callback => callback(this.watchBearingId !== undefined));
    }

    addMarker(marker) {
        if(this._map.loaded()) {
            // https://docs.mapbox.com/mapbox-gl-js/api/#marker#addto
            marker.addTo(this._map);
        }
        else {
            this._map.once('load', event => {
                // https://docs.mapbox.com/mapbox-gl-js/api/#marker#addto
                marker.addTo(this._map);
            });
        }
    }
    
    onload(event) {
        console.log('map loaded');

        // https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
        navigator.geolocation.getCurrentPosition(geoLocation => {
            const {longitude, latitude} = geoLocation.coords;
            const position = {longitude, latitude};
            this.setPosition(position);
        })
    }
    onclick(event) {
        const {lngLat} = event;
        const position = {
            longitude : lngLat.lng,
            latitude : lngLat.lat,
        };
        this.publish(this.viewId, "map-click", position);
    }
    
    // https://croquet.io/sdk/docs/View.html#detach
    detach() {
        this.clearBearingWatch();

        // https://docs.mapbox.com/mapbox-gl-js/api/#map#remove
        this._map.remove();
        super.detach();
    }

    setCenter(position) {
        // https://docs.mapbox.com/mapbox-gl-js/api/#map#setcenter
        this._map.setCenter([position.longitude, position.latitude]);
    }
    setZoom(zoom) {
        // https://docs.mapbox.com/mapbox-gl-js/api/#map#setzoom
        this._map.setZoom(zoom);
    }
    
    setBearing(bearing) {
        // https://docs.mapbox.com/mapbox-gl-js/api/#map#setbearing
        this._map.setBearing(bearing);
        this.publish(this.viewId, "map-update-bearing", bearing);
    }
    setBearingWatch(watch) {
        if(watch)
            this.watchBearing();
        else
            this.clearBearingWatch();
    }
    watchBearing() {
        if(this.watchBearingId == undefined) {
            if(this.watchBearingCallback == undefined) {
                // https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent
                this.watchBearingCallback = ((event) => {
                    const {webkitCompassHeading} = event;
                    if(typeof webkitCompassHeading == "number") {
                        this._bearing = webkitCompassHeading;
                    }
                }).bind(this);
            }
    
            // https://developer.mozilla.org/en-US/docs/Web/API/Detecting_device_orientation
            window.addEventListener("deviceorientation", this.watchBearingCallback);
            this.watchBearingId = window.setInterval(() => {
                if(this._bearing) {
                    this.publish(this.viewId, "map-set-bearing", this._bearing);
                }
            }, 100);
            this.publish(this.viewId, "map-update-bearing-watch", true);
        }
    }
    clearBearingWatch() {
        if(this.watchBearingId !== undefined) {
            window.removeEventListener("deviceorientation", this.watchBearingCallback);
            window.clearInterval(this.watchBearingId);
            delete this.watchBearingId;
            this.publish(this.viewId, "map-update-bearing-watch", false);
        }
    }

    setPosition(position) {
        this.position = position;
        this.publish(this.viewId, "map-update-position", position);
    }

    watchPosition() {
        if(this.watchPositionId == undefined) {
            // https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
            this.watchPositionId = navigator.geolocation.watchPosition(geoLocationPosition => {
                const {longitude, latitude} = geoLocationPosition.coords;
                const position = {longitude, latitude};
                this.setPosition(position);
            }, error => {
                console.error(error);
            }, {
                // https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions
                enableHighAccuracy : true,
            });

            this.publish(this.viewId, "map-update-watch", true);
        }
    }
    clearWatch() {
        if(this.watchPositionId !== undefined) {
            // https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/clearWatch
            navigator.geolocation.clearWatch(this.watchPositionId);
            delete this.watchPositionId;
            this.publish(this.viewId, "map-update-watch", false);
        }
    }
    setWatch(watch) {
        if(watch)
            this.watchPosition();
        else
            this.clearWatch();
    }

    centerAtCurrentLocation(position) {
        if(this._centerAtCurrentLocation)
            this.setCenter(position);
    }
}

export default MapView;