const mongoose = require('mongoose');

const panierSchema = new mongoose.Schema({
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produit', // Reference to the Produit model
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  quantite: {
    type: Number,
    default: 1,
  },
  total: {
    type: Number,
    required: true,
  },
  reference: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  tva: {
    type: Number,
    default: 10.00, // Default TVA (Tax) 20%
  },
  forfait: {
    type: Number,
    required: false,
  },
  montantHT: {
    type: Number,
    required: true,
  },
  montantTVA: {
    type: Number,
    required: true,
  },
  montantTTC: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    // required: true,
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: false,
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Commercial", // Referring to the Commercial model
    required: false, // If this is optional, you can make it not required
  },
  userType: {
    type: String,
    enum: ['admin', 'commercial'],
    required: true
  },
  leadId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Chat', 
    required: true 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userType: {
    type: String,
    enum: ['admin', 'commercial'],
    required: true
  }
});

const Panier = mongoose.model('Panier', panierSchema);

module.exports = Panier;
