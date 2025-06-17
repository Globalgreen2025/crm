const mongoose = require("mongoose");

const CommandeSchema = new mongoose.Schema({
  command: {
    type: String,
    required: true,
    default: 'devis' // Default value if not provided
  },
  command_type: { type: String, enum: ["commande", "devis"], required: true },
  date: { type: Date, required: true },
  nom: String,
  siret: String,
  email: String,
  phone: String,
  codepostal: String,
  raissociale: String,
  ville: String,
  address: String,
  commercialName: { type: String },
  title: {
    type: String,
    required: false,
  },
  category: {
    type: String,
    required: false,
  },
  reference: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  forfait: {
    type: Number,
    required: false,
  },
  numCommand: {
    type: String,
    required: true,
  },
  originalNumCommand: {
    type: String,
    default: null,
  },

  TVA: {
    type: Number,
  },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: false,
  },
  totalHT: {
    type: Number,
    required: true,
  },
  totalTTC: {
    type: Number,
    required: true,
  },
  totalTVA: {
    type: Number,
    required: true,
  },
  quantite: {
    type: Number,
    required: true,
  },
  items: [{
    produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Produit' },
    title: String,
    description: String,
    reference: String,
    category: String,
    quantite: Number,
    prixUnitaire: Number,
    montantHT: Number,
    montantTVA: Number,
    montantTTC: Number,
    tva: Number,
    forfait: Number
  }],

  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Commercial", // Referring to the Commercial model
    required: false, // If this is optional, you can make it not required
  },
});

const handleCommandTypeChange = async (doc) => {
  if (doc.command_type === 'commande') {
    try {
      await mongoose.model('Chat').findByIdAndUpdate(
        doc.lead,
        { $set: { type: 'client' } },
        { new: true }
      );
      console.log(`Updated lead ${doc.lead} to client status`);
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  }
};

CommandeSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    await handleCommandTypeChange(doc);
  }
});

CommandeSchema.post('save', async function(doc) {
  if (doc.command_type === 'commande') {
    try {
      await mongoose.model('Chat').findByIdAndUpdate(
        doc.lead,
        { $set: { type: 'client' } },
        { new: true }
      );
      console.log(`Automatically updated lead ${doc.lead} to client status`);
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  }
});

CommandeSchema.pre('remove', async function(next) {
  try {
    const remainingCommands = await this.model('Commande').countDocuments({
      lead: this.lead,
      command_type: 'commande',
      _id: { $ne: this._id }
    });

    if (remainingCommands === 0) {
      await mongoose.model('Chat').findByIdAndUpdate(
        this.lead,
        { $set: { type: 'prospect' } }
      );
      console.log(`Reverted lead ${this.lead} to prospect status`);
    }
    next();
  } catch (error) {
    next(error);
  }
});


module.exports = mongoose.model("Commande", CommandeSchema);
