const mongoose = require("mongoose");

const programSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    prixVente: {
      type: Number,
      required: false
    },
    forfait: {
      type: Number,
      required: false
    },
    category: {
      type: String,
      enum: [
        'OUVERTURE',
        'Assechement des murs',
        'TOITURE',
        'ISOLATION',
        'RADIATEUR',
        'VENTILATION',
        'TABLEAUX ELECTRIQUES',
        'FACADE EXTERIEUR'
      ],
      required: false
    },
    reference: {
      type: String,
      required: false
    },
    title: {
      type: String,
      required: false
    },
    description: {
      type: String,
      required: false
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Program", programSchema);
