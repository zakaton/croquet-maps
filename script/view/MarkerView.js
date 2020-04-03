class MarkerView extends Croquet.View {
    constructor(model, view) {
        super(model);

        this.model = model;
        this.view = view;

        this.markerElement = document.createElement('div');
        // https://docs.mapbox.com/mapbox-gl-js/api/#marker
        this.marker = new mapboxgl.Marker(this.markerElement);
        
        if(model.position)
            this.marker.setLngLat([model.position.longitude, model.position.latitude]);

        this.popupElement = document.createElement('div');
        
        // https://docs.mapbox.com/mapbox-gl-js/api/#popup
        this.popup = new mapboxgl.Popup({offset : 25});
        this.popup.setDOMContent(this.popupElement);

        this.subscribe(this.model.id, "remove-marker", this._removed);
        this.subscribe(this.model.id, "set-position", this._setPosition);

        switch(this.type) {
            case "user":
                // download picture
                // set marker for calling
                // add picture
                break;
            case "picture":
                // download picture
                this.markerElement.innerText = '🖼️';
                break;
            case "video":
                // download video
                this.markerElement.innerText = '📺';
                break;
            case "comment":
                this.popupElement.innerText = model.comment;
                this.markerElement.innerText = '💬';
                break;
            default:
                break;
        }
    }

    add() {
        this.publish(this.viewId, "add-marker", this.marker);
    }
    remove() {
        if(this.view.crypto) {
            this.publish(this.model.id, "remove-marker-request", this.view.crypto.sign());
        }
    }
    _removed() {
        this.marker.remove();
        this.publish(this.view.id, "remove-marker", this);
    }

    setPosition(position) {
        if(this.view.crypto) {
            this.publish(this.model.id, "set-position-request", this.view.crypto.sign({position}));
        }
    }
    _setPosition() {
        this.marker.setLngLat([this.model.position.longitude, this.model.position.latitude]);
    }
}

export default MarkerView;