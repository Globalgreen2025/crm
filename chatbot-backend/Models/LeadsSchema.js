const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  addedBy: {
    name: { type: String, required: true }, // Ensure `name` is marked as required
  },
  addedAt: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      // required: true,
    },
    codepostal: {
      type: String,
    },
    address: {
      type: String,
    },
    ville: {
      type: String,
    },
    document: {
      type: String,
    },

    email: {
      type: String,
      // required: true,
      match: /.+\@.+\..+/, // Basic email format validation
    },
    email1: {
      type: String,
      // required: true,
      match: /.+\@.+\..+/,
    },
    phone: {
      type: String,
      required: false,
      default: "",
      // unique: true,
    },
   
    phoneFix: {
      type: String,
      default: "",
    },
    prestation: {
      type: String,
      default: "",
    },
    societe: {
      type: String,
      default: "",
    },

    // siret: {
    //   type: Number,
    //   default: "",
    // },
    siret: {
      type: String,
      default: "",
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty
          const digitsOnly = v.replace(/\D/g, '');
          return digitsOnly.length === 14;
        },
        message: props => `${props.value} n'est pas un numéro SIRET valide (doit contenir 14 chiffres)`
      }
    },
    reglement: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      required: false,
    },

    initial: {
      type: String,
      required: false,
    },
    type_propriété: {
      type: String,
      required: false,
    },
    logement: {
      type: String,
      required: false,
    },
    détails_logement: {
      type: String,
      required: false,
    },
    request_hot_water: {
      type: String,
      required: false,
    },
    request_heating_system: {
      type: String,
      required: false,
    },
    facture: {
      type: String,
      required: false,
    },

    type: { type: String, default: "prospect" },
    commentaires: [commentSchema],
    commercial: { type: mongoose.Schema.Types.ObjectId, ref: "Commercial" },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "Manager" },
    // In your Chat schema add:
tickets: [{ 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'Ticket' 
}]
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
