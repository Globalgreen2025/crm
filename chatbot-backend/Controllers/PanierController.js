const Panier = require("../Models/panierSchema");
const Produit = require("../Models/produitSchema"); // Assuming you have a Produit model
const mongoose = require('mongoose');

class PanierController {
  // static async createPanier(req, res) {
  //   try {
  //     const { produitId, quantite,  total: prixVente, forfait, leadId, session} = req.body;

  //     // Find the product by ID
  //     const produit = await Produit.findById(produitId);
  //     if (!produit) {
  //       return res.status(404).json({ message: "Produit non trouvé" });
  //     }

  
  //     const tva = parseFloat(produit.tva);

  //     if (isNaN(prixVente) || isNaN(tva)) {
  //       return res
  //         .status(400)
  //         .json({ message: "Invalid product price or TVA value" });
  //     }

  //     // Calculate Montant HT, TVA, and TTC
  //     const montantHT = prixVente * quantite;
  //     const montantTVA = (montantHT * tva) / 100;
  //     const montantTTC = montantHT + montantTVA;

  //     if (isNaN(montantHT) || isNaN(montantTVA) || isNaN(montantTTC)) {
  //       return res.status(400).json({ message: "Invalid amount calculation" });
  //     }

  //     // Check if the product already exists in the panier
  //     const existingPanierItem = await Panier.findOne({ produit: produitId });
  //     if (existingPanierItem) {
  //       // If the product exists, update the quantity and recalculate
  //       // existingPanierItem.quantite = quantite;
  //       existingPanierItem.quantite += 1;
  //       existingPanierItem.montantHT = existingPanierItem.quantite * prixVente;
  //       existingPanierItem.montantTVA =
  //         (existingPanierItem.montantHT * tva) / 100;
  //       existingPanierItem.montantTTC =
  //         existingPanierItem.montantHT + existingPanierItem.montantTVA;
  //       await existingPanierItem.save();
  //       return res.status(200).json(existingPanierItem);
  //     }

  //     // If not, create a new panier item
  //     const panier = new Panier({
  //       produit: produitId,
  //       description: produit.description,
  //       title: produit.title,
  //       reference: produit.reference,
  //       category: produit.category,
  //       quantite: quantite,
  //       // total: produit.prixVente,
  //       total: prixVente,
  //       forfait: forfait,
  //       tva: tva,
  //       montantHT: montantHT,
  //       montantTVA: montantTVA,
  //       montantTTC: montantTTC,
  //       leadId,
  //      session
  //     });
  //     console.log("Panier item created:", panier);

  //     // Save the new cart item
  //     await panier.save();
  //     res.status(201).json(panier);
  //   } catch (error) {
  //     console.error("Error adding to panier:", error);
  //     res.status(500).json({ message: "Failed to add product to panier" });
  //   }
  // }
//   static async createPanier(req, res) {
//     try {
//       const { produitId, quantite, total: prixVente, forfait, leadId, session } = req.body;
//       console.log("Creating panier with data:", req.body);

//       // Find the product by ID
//       const produit = await Produit.findById(produitId);
//       if (!produit) {
//         return res.status(404).json({ message: "Produit non trouvé" });
//       }

//       const tva = parseFloat(produit.tva);

//       if (isNaN(prixVente) || isNaN(tva)) {
//         return res
//           .status(400)
//           .json({ message: "Invalid product price or TVA value" });
//       }

//       // Calculate base HT amount (prixVente + forfait if exists)
//       const baseHT = forfait ? parseFloat(prixVente) + parseFloat(forfait) : parseFloat(prixVente);
      
//       // Calculate Montant HT, TVA, and TTC
//       const montantHT = baseHT * quantite;
//       const montantTVA = (montantHT * tva) / 100;
//       const montantTTC = montantHT + montantTVA;

//       if (isNaN(montantHT) || isNaN(montantTVA) || isNaN(montantTTC)) {
//         return res.status(400).json({ message: "Invalid amount calculation" });
//       }

//       // Check if the product already exists in the panier
//       const existingPanierItem = await Panier.findOne({ produit: produitId });
//       if (existingPanierItem) {
//         // If the product exists, update the quantity and recalculate
//         existingPanierItem.quantite += 1;
        
//         // Recalculate with forfait if it exists
//         const existingBaseHT = existingPanierItem.forfait 
//           ? parseFloat(existingPanierItem.total) + parseFloat(existingPanierItem.forfait)
//           : parseFloat(existingPanierItem.total);
          
//         existingPanierItem.montantHT = existingPanierItem.quantite * existingBaseHT;
//         existingPanierItem.montantTVA = (existingPanierItem.montantHT * tva) / 100;
//         existingPanierItem.montantTTC = existingPanierItem.montantHT + existingPanierItem.montantTVA;
        
//         await existingPanierItem.save();
//         return res.status(200).json(existingPanierItem);
//       }

//       // If not, create a new panier item
//       const panier = new Panier({
//         produit: produitId,
//         description: produit.description,
//         title: produit.title,
//         reference: produit.reference,
//         category: produit.category,
//         quantite: quantite,
//         total: prixVente,
//         forfait: forfait || undefined, // Store undefined if no forfait
//         tva: tva,
//         montantHT: montantHT,
//         montantTVA: montantTVA,
//         montantTTC: montantTTC,
//         leadId,
//         session
//       });

//       console.log("Panier item created:", panier);
//       await panier.save();
//       res.status(201).json(panier);
//     } catch (error) {
//       console.error("Error adding to panier:", error);
//       res.status(500).json({ message: "Failed to add product to panier" });
//     }
// }
static async createPanier(req, res) {
  try {
    const { produitId, quantite, total: prixVente, forfait, leadId, userId, userType, userTypeRef } = req.body;

    // Validate user type
    if (!['admin', 'commercial'].includes(userType)) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    const produit = await Produit.findById(produitId);
    if (!produit) return res.status(404).json({ message: "Produit non trouvé" });

    const tva = parseFloat(produit.tva);
    if (isNaN(prixVente)) { 
      return res.status(400).json({ message: "Invalid product price" });
    }

    // Check for existing item for this user
    const existingPanierItem = await Panier.findOne({ 
      produit: produitId,
      userId: userId,
      userType: userType
    });

    if (existingPanierItem) {
      existingPanierItem.quantite += quantite;
      
      const baseHT = existingPanierItem.forfait 
        ? parseFloat(existingPanierItem.total) + parseFloat(existingPanierItem.forfait)
        : parseFloat(existingPanierItem.total);
        
      existingPanierItem.montantHT = existingPanierItem.quantite * baseHT;
      existingPanierItem.montantTVA = (existingPanierItem.montantHT * tva) / 100;
      existingPanierItem.montantTTC = existingPanierItem.montantHT + existingPanierItem.montantTVA;
      
      await existingPanierItem.save();
      return res.status(200).json(existingPanierItem);
    }

    // Calculate amounts for new item
    const baseHT = forfait ? parseFloat(prixVente) + parseFloat(forfait) : parseFloat(prixVente);
    const montantHT = baseHT * quantite;
    const montantTVA = (montantHT * tva) / 100;
    const montantTTC = montantHT + montantTVA;

    const panier = new Panier({
      produit: produitId,
      description: produit.description,
      title: produit.title,
      reference: produit.reference,
      category: produit.category,
      quantite: quantite,
      total: prixVente,
      forfait: forfait || undefined,
      tva: tva,
      montantHT,
      montantTVA,
      montantTTC,
      leadId,
      userId,
      userType,
      userTypeRef
    });
    console.log("Panier item created:", panier);

    await panier.save();
    res.status(201).json(panier);
  } catch (error) {
    console.error("Error adding to panier:", error);
    res.status(500).json({ message: "Failed to add product to panier" });
  }
}
  static async getAllPanier(req, res) {
    const { id } = req.params;
    const session = req.userId;

    try {
      const panierItems = await Panier.find({ leadId: new mongoose.Types.ObjectId(id)}).sort({ createdAt: -1 });
      res.status(200).json(panierItems);
    } catch (error) {
      console.error("Error fetching panier:", error);
      res.status(500).json({ message: "Failed to fetch panier" });
    }
  }
  static async deletePanierById(req, res) {
    try {
      const { panierId } = req.params; // Get panierId from URL parameter (this is _id)


      // Use findByIdAndDelete instead of remove
      const result = await Panier.findByIdAndDelete(panierId);

      if (!result) {
        return res.status(404).json({ message: "Panier item not found" });
      }

      return res.status(200).json({ message: "Produit removed from panier" });
    } catch (error) {
      console.error("Error deleting panier item:", error);
      return res.status(500).json({ message: "Failed to remove panier item" });
    }
  }

  // Assuming the frontend sends a request to set quantity to 0
  static async updatePanierItem(req, res) {
    try {
      const { panierId } = req.params;

      const { quantite } = req.body; // New quantity (can be 0)

  

      const panierItem = await Panier.findById(panierId);

      if (!panierItem) {
        return res.status(404).json({ message: "Item not found in panier" });
      }

      panierItem.quantite = quantite; // Set the quantity to 0 (or whatever value)
      panierItem.montantHT = panierItem.quantite * panierItem.  total;
      panierItem.montantTVA = (panierItem.montantHT * panierItem.tva) / 100;
      panierItem.montantTTC = panierItem.montantHT + panierItem.montantTVA;
      // panierItem.marge = panierItem.quantite * panierItem.marge;
      panierItem.prixVente = panierItem.quantite * panierItem.prixVente;


      console.log("Updating panier item:", panierItem);
      await panierItem.save();
      res.status(200).json(panierItem);
    } catch (error) {
      console.error("Error updating panier item:", error);
      res.status(500).json({ message: "Failed to update panier item" });
    }
  }
}

module.exports = PanierController;
