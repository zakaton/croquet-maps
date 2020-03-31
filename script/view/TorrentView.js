class TorrentView extends Croquet.View {
    constructor(model) {
        super(model);
    }

    seed(files, options, callback) {
        this.publish(this.viewId, "torrent-seed", {files, options, callback});
    }

    add(torrentId, options, callback) {
        this.publish(this.viewId, "torrent-add", {torrentId, options, callback});
    }
}

export default TorrentView;