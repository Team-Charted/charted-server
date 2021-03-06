const mongoose = require('mongoose');

const AlbumSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    chart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "chart"
    },
    songs: [
        {
            songId: {
                type: String,
            },
            title: {
                type: String,
            },
            artist: {
                type: String,
            },
            leadSingle: {
                type: Boolean,
            },
            imageURL: {
                type: String
            },
            credits: {
                type: Number,
            }
        }
    ]
});

module.exports = Album = mongoose.model('album', AlbumSchema);