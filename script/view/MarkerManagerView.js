import MarkerView from "./MarkerView.js";

class MarkerManagerView extends Croquet.View {
    constructor(model, user) {
        super(model);
        this.model = model;

        this.user = user;
        this.crypto = user.crypto;
        
        this.markers = [];
        this.model.markers.forEach(markerModel => this._create(markerModel));
        this.subscribe(model.id, "create-marker", this._create);
        this.subscribe(this.id, "remove-marker", this._remove);
        
        if(this.crypto) {
            this.subscribe(this.viewId, "create-marker-request", this.create);
        }
    }

    detach() {
        this.markers.forEach(marker => marker.detach());
        
        // https://croquet.io/sdk/docs/View.html#detach
        super.detach();
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
