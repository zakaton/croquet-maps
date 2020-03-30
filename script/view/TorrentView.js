class TorrentView extends Croquet.View {
    constructor(model) {
        super(model);

        // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#client--new-webtorrentopts
        this._client = new WebTorrent();
        
        // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientontorrent-function-torrent-
        this._client.on('torrent', torrent => {

            // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#torrentonnopeers-function-announcetype-
            torrent.on('noPeers', announceType => {
                console.log(torrent, "noPeers");
            });
        });

        // https://github.com/webtorrent/webtorrent/blob/master/docs/api.md#clientonerror-function-err-
        this._client.on('error', error => {
            if(error.message.includes("duplicate torrent")) {
                const strings = error.message.split(' ');
                const magnetURI = strings[strings.length-1];
                console.log(magnetURI);
            }
        });
    }

    
}

export default TorrentView;