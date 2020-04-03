import MarkerView from "./MarkerView.js";

class MarkerManagerView extends Croquet.View {
    constructor(model, {crypto}) {
        super(model);
        this.model = model;

        this.crypto = crypto;
        
        this.markers = [];
        this.model.markers.forEach(markerModel => this._create(markerModel));
        this.subscribe(model.id, "create-marker", this._create);
        this.subscribe(this.id, "remove-marker", this._remove);
    }

    create(options) {
        if(this.crypto) {
            this.publish(this.model.id, "create-marker-request", this.crypto.sign({options}));
        }
    }
    _create(markerModel) {
        const marker = new MarkerView(markerModel, this);
        if(markerModel.type == "user")
            this.userMarker = marker;
        this.markers.push(marker);
    }
    
    _remove(marker) {
        this.markers.splice(this.markers.indexOf(marker), 1);
    }
}

export default MarkerManagerView;
