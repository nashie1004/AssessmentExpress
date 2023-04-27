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
    messages: []
})

module.exports = mongoose.model('asWithImagesLast11', UserSchema)
