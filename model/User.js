const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    history: {
        type: Map,
        of: [],
        default: {
            'test': 101
        }
    }
})

module.exports = mongoose.model('1ass22', UserSchema)
