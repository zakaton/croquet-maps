import MarkerModel from "./MarkerModel.js";

class MarkerManagerModel extends Croquet.Model {
    init(user) {
        super.init();
        this.crypto = user.crypto;
        this.user = user;

        this.markers = [];
        this.userMarker = MarkerModel.create({model : this, type : "user"});
        this.markers.push(this.userMarker);
        this.publish(this.id, "create-marker", this.userMarker);

        this.subscribe(this.id, "create-marker-request", this.create);
    }

    create() {
        const object = this.crypto.verify(...arguments);
        if(object) {
            const {options} = object;
            options.model = this;
            const markerModel = MarkerModel.create(options);
            this.markers.push(markerModel);
            this.publish(this.id, "create-marker", markerModel);
        }
    }
    remove(markerModel) {
        this.markers.splice(this.markers.indexOf(markerModel), 1);
        markerModel.destroy();
    }
}
MarkerManagerModel.register();

export default MarkerManagerModel;