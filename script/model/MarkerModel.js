class MarkerModel extends Croquet.Model {
    init({model, position, type, magnetURI, comment}) {
        super.init();

        this.model = model;
        this.type = type;

        this.position = position;

        switch(this.type) {
            case "user":
                break;
            case "picture":
                this.picture = magnetURI;
                break;
            case "video":
                this.video = magnetURI;
                break;
            case "comment":
                this.comment = comment;
                break;
            case "audio":
                this.audio = magnetURI;
                break;
            default:
                break;
        }

        this.subscribe(this.id, "remove-marker-request", this.remove);
        this.subscribe(this.id, "set-position-request", this.setPosition);
    }

    get position() {
        if(this.type == "user") {
            return this.model.user.position;
        }
        else {
            return this._position;
        }
    }
    set position(position) {
        if(this.type !== "user")
            this._position = position;
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