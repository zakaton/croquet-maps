/*
    TODO
        Selecting Position
        Setting Center/Zoom/Bearing
*/

class MapView extends Croquet.View {
    constructor(model, options = {}) {
        super(model);

        options.container =  options.container ||  document.createElement("div");
        options.style = options.style || 'mapbox://styles/mapbox/streets-v11';
        
        // https://docs.mapbox.com/mapbox-gl-js/api/#map
        this._map = new mapboxgl.Map(options);
        {
            const mapElement = document.getElementById("map");
            mapElement.innerHTML = '';
            mapElement.appendChild(this._map._container);
            
            // https://docs.mapbox.com/mapbox-gl-js/api/#map#resize
            this._map.resize();
        }

        if(window.croquet_map)
            window.croquet_map.remove();
        window.croquet_map = this._map;

        this.subscribe(this.viewId, "add-marker", this.addMarker);
    }

    addMarker(marker) {
        // https://docs.mapbox.com/mapbox-gl-js/api/#marker#addto
        marker.addTo(this._map);
    }

    selectPosition() {
        return new Promise((resolve, reject) => {
            // add UI stuff
        });
    }

    center() {
        // Fill
    }
}

export default MapView;