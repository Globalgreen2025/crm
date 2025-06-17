const mongoose = require('mongoose');

const CommercialSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active'
    },
    lastActivity: {
        type: Date,
        default: null
    },
}, { timestamps: true });

const modelName = 'Commercial';

if (mongoose.models[modelName]) {
    module.exports = mongoose.model(modelName);
} else {
    module.exports = mongoose.model(modelName, CommercialSchema);
}