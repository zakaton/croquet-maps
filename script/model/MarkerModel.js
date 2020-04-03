class MarkerModel extends Croquet.Model {
    init({model, position, type, magnetURI, comment}) {
        super.init();

        this.model = model;
        this.type = type;

        if(position) {
            const {longitude, latitude} = options.position;
            this.position = {longitude, latitude};
        }

        switch(this.type) {
            case "user":
                this.magnetURI = magnetURI;
                break;
            case "picture":
                this.magnetURI = magnetURI;
                break;
            case "video":
                this.magnetURI = magnetURI;
                break;
            case "comment":
                this.comment = comment;
                break;
            default:
                break;
        }

        this.subscribe(this.id, "remove-marker-request", this.remove);
        this.subscribe(this.id, "set-position-request", this.setPosition);
    }

    remove() {
        const object = this.model.crypto.verify(...arguments);
        if(object) {
            this.publish(this.id, "remove-marker", this);
            this.model.remove(this);
        }
    }

    setPosition() {
        const object = this.model.crypto.verify(...arguments);
        if(object) {
            const {position} = object;
            this.position = position;
            this.publish(this.id, "set-position");
        }
    }
}
MarkerModel.register();

export default MarkerModel;