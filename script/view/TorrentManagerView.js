class TorrentManagerView extends Croquet.View {
    constructor(model) {
        super(model);

        this.subscribe(this.viewId, "torrent-seed", this._seed);
        this.subscribe(this.viewId, "torrent-add", this._add);

        // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#client--new-webtorrentopts
        this._client = new WebTorrent();
        this._hashingClient = new WebTorrent();

        // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientonerror-function-err-
        this._client.on('error', error => {
            console.error(error);
        });
    }

    getMagnetURI(files, callback) {
        // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientseedinput-opts-function-onseed-torrent-
        this._hashingClient.seed(files, torrent => {
            const {magnetURI} = torrent;

            // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#torrentdestroycallback
            torrent.destroy(() => {
                callback(magnetURI);
            });
        });
    }

    seed(files, options, callback) {
        this.getMagnetURI(files, magnetURI => {
            // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientgettorrentid
            const _torrent = this._client.get(magnetURI);

            if(_torrent) {
                // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#torrentdestroycallback
                _torrent.destroy(() => {
                    // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientseedinput-opts-function-onseed-torrent-
                    this._client.seed(...arguments);
                });
            }
            else {
                // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientseedinput-opts-function-onseed-torrent-
                this._client.seed(...arguments);
            }
        });
    }
    _seed({files, options, callback}) {
        this.seed(files, options, callback);
    }

    add(torrentId, options, callback) {
        // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientgettorrentid
        const torrent = this._client.get(torrentId);
        if(!torrent) {
            // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientaddtorrentid-opts-function-ontorrent-torrent-
            this._client.add(...arguments);
        }
        else {
            callback = callback || options;
            callback(torrent);
        }
    }
    _add({torrentId, options, callback}) {
        this.add(torrentId, options, callback);
    }
}

export default TorrentManagerView;