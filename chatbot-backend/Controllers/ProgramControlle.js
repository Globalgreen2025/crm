const Program = require("../Models/programSchema");
const Event = require("../Models/eventSchema");
const Command = require("../Models/commandSchema");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

class ProgramController {
 static async createProgram(req, res) {
  const { userId } = req.body;
     try {

       
       const {
          userId,
         category,
         reference,
         title,
         description,
         prixVente,
         forfait,
       } = req.body;
 
       const newProduit = new Program({
        
         userId,
         category,
         reference,
         title,
         description,
         prixVente,
         forfait,
         
       });
 
       await newProduit.save();
       res.status(201).json(newProduit);
     } catch (error) {
       console.error("Error creating produit:", error);
       res.status(500).json({ message: "Failed to create produit." });
     }
   }
 
   static async getProgramById(req, res) {
  
     
     try {
       const produits = await Program.find();
       res.status(200).json(produits);
     } catch (error) {
       console.error("Error fetching produits:", error);
       res.status(500).json({ message: "Failed to fetch produits." });
     }
   }
 
   static async updateProgramById(req, res) {
     const { id } = req.params;
     const {
       category,
       reference,
       title,
       description,
       prixVente,
       forfait,
       
 
       userId,
     } = req.body;

     try {
       const updatedProduit = await Program.findByIdAndUpdate(
         id,
         {
           category,
           reference,
           title,
           description,
           prixVente,
           forfait,
         },
         { new: true }
       );
 
       if (!updatedProduit) {
         return res.status(404).json({ message: "Produit not found." });
       }
 
       res.status(200).json(updatedProduit);
     } catch (error) {
       console.error("Error updating produit:", error);
       res.status(500).json({ message: "Failed to update produit." });
     }
   }
 
   // static async deleteProduitById(req, res) {
   //   const { id } = req.params;
   //   try {
   //     const deletedProduit = await Produit.findByIdAndDelete(id);
   //     if (!deletedProduit) {
   //       return res.status(404).json({ message: "Produit not found." });
   //     }
   //     res.status(200).json({ message: "Produit deleted successfully." });
   //   } catch (error) {
   //     console.error("Error deleting produit:", error);
   //     res.status(500).json({ message: "Failed to delete produit." });
   //   }
   // }
 
   // New method to get all categories
  
   static async getCategories(req, res) {
     try {
       const categories = [
         'OUVERTURE',
         'Assechement des murs',
         'TOITURE',
         'ISOLATION',
         'RADIATEUR',
         'VENTILATION',
         'TABLEAUX ELECTRIQUES',
         'FACADE EXTERIEUR'
       ];
       res.status(200).json(categories);
     } catch (error) {
       console.error("Error fetching categories:", error);
       res.status(500).json({ message: "Failed to fetch categories." });
     }
   }

   static async getAllPrograms(req, res) {}
 
  

  static async deleteProgramById(req, res) {
    try {
        const { id } = req.params;
        await Program.findByIdAndDelete(id);
        res.status(200).json({ message: 'Program deleted successfully.' });
      } catch (error) {
        console.error('Error deleting program:', error);
        res.status(500).json({ message: 'Failed to delete program.' });
      }
  }

  static async createEvent(req, res) {
    try {
 
      const leadId = req.body.leadId;

      const { event_date, event_time, objective, comment, session } = req.body;
  
      const newEvent = new Event({
        session,
        event_date,
        event_time,
        objective,
        comment,
        lead: leadId
      });
  
      await newEvent.save();
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error saving event:", error);
      res.status(500).json({ message: "Error saving event", error });
    }
  }
  static async getAllEvents(req, res) {
    const { id } = req.params; // Get leadId from query parameter
    const session = req.userId;
    console.log('id', id)
    console.log('session', session)
  
    try {
      const events = await Event.find({ lead: new mongoose.Types.ObjectId(id), session: new mongoose.Types.ObjectId(session) }).sort({ event_date: -1 });
      console.log('events', events);
      res.status(200).json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Error fetching events", error });
    }
  }
  static async getAllEventsBySession(req, res) {
    const session = req.userId;
    try {
      const events = await Event.find({ session: new mongoose.Types.ObjectId(session) });
      console.log('events', events);
      res.status(200).json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Error fetching events", error });
    }
  }
  static async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      await Event.findByIdAndDelete(id);
      res.status(200).json({ message: "Event deleted successfully." });
    }
    catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event." });
    }
  }

//  static async createCommand(req, res) {
//   try {
//     const leadId = req.body.leadId;
//     const { 
//       session,
//       command,
//       commercialName,
//       command_type,
//       description,
//       prixUnitaire,
//       quantite,
//       totalHT,
//       totalTVA,
//       totalTTC,
//       date,
//       nom,
//        email,
//       phone,
//        siret,
//        codepostal,
//        raissociale,
//        ville,
//        address,
//        numCommand,
//         code,
//         marge,
//         marque
//         } = req.body;

//     const newCommand = new Command({ session, lead: leadId,
//         command_type, 
//         command,
//         commercialName,
//         date,
//         description,
//         prixUnitaire,
//         quantite,
//         totalHT,
//         totalTVA,
//         totalTTC,
//         nom,
//         email,
//         phone,
//         siret,
//         codepostal,
//         raissociale,
//         ville,
//         address,
//         numCommand,
//         marge,
//         code,
//         marque
//       });
//     await newCommand.save();

//     res.status(201).json(newCommand);
//   } catch (error) {
//     console.error("Error creating command:", error);
//     res.status(500).json({ message: "Error creating command", error });
//   }
//  }
static async createCommand(req, res) {
  try {
    const leadId = req.body.leadId;
    const { 
      session,
      command,
      commercialName,
      command_type,
      description,
      prixUnitaire,
      quantite,
      totalHT,
      totalTVA,
      totalTTC,
      date,
      nom,
      email,
      phone,
      siret,
      codepostal,
      raissociale,
      ville,
      address,
      numCommand,
      category,
      title,
      reference,
      items

    } = req.body;

    const commandData = {
      session,
      lead: leadId,
      command_type, 
      command,
      commercialName,
      date,
      description,
      prixUnitaire,
      quantite,
      totalHT,
      totalTVA,
      totalTTC,
      nom,
      email,
      phone,
      siret,
      codepostal,
      raissociale,
      ville,
      address,
      numCommand,
      category,
      title,
      reference,
      items,
    };

    // Store originalNumCommand if it starts with "D"
    if (numCommand?.startsWith("D")) {
      commandData.originalNumCommand = numCommand;
    }

    const newCommand = new Command(commandData);
    await newCommand.save();

    res.status(201).json(newCommand);
  } catch (error) {
    console.error("Error creating command:", error);
    res.status(500).json({ message: "Error creating command", error });
  }
}

 static async getAllCommands (req, res) {
  const { id } = req.params;
  const session = req.userId
try {
  const commands = await Command.find({
    lead: new mongoose.Types.ObjectId(id), // <-- lead, not leadId
    session: new mongoose.Types.ObjectId(session),
  }).sort({ createdAt: -1 });
  res.status(200).json(commands);
  } catch (error) {
    console.error("Error fetching commands:", error);
    res.status(500).json({ message: "Error fetching commands", error });
  }
 }

 static async getAllsCommands (req, res) {
  
  // console.log('session', session)
try {
  const commands = await Command.find().sort({ createdAt: -1 });
  
  // console.log('Found commands:', commands);
  res.status(200).json(commands);
} catch (error) {
  console.error("Error fetching commands:", error);
  res.status(500).json({ message: "Error fetching commands", error });
}
}

 static async getCommandById (req, res) {
  const { commandId } = req.params;
  console.log('commandId', commandId)
  try {
  

    // Convert string ID to ObjectId explicitly
    const com = await Command.findById(new mongoose.Types.ObjectId(commandId));
    console.log('com', com)

    if (!com) {
      return res.status(404).json({ message: "Produit non trouvé." });
    }
    res.status(200).json(com); // Return the product (not an array)
  } catch (error) {
    console.error("Erreur lors de la récupération du produit:", error);
    res.status(500).json({ message: "Échec de la récupération du produit." });
  }
 }


static async validateCommand (req, res) {
const { id } = req.params;
console.log('id', id)
  try {
    // Fetch the existing command
    const command = await Command.findById(id);
    if (!command) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }


    // Update the command in the database with the new fields
    const updatedCommand = await Command.findByIdAndUpdate(
      id,
      {
        command_type: req.body.command_type,
        numCommand: req.body.numCommand, // Ensure this is updated
        // You can add other fields as needed from the request body
      },
      { new: true, runValidators: true }
    );
    


    if (!updatedCommand) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    res.status(200).json(updatedCommand);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la commande:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour", error });
  }
}

 static async deleteCommandById(req, res) {
  const { id } = req.params;

  try {
    const deletedCommand = await Command.findByIdAndDelete(id);

    if (!deletedCommand) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    res.status(200).json({ message: 'Commande supprimée avec succès', deletedCommand });
  } catch (error) {
    console.error("Erreur lors de la suppression de la commande:", error);
    res.status(500).json({ message: "Erreur lors de la suppression de la commande", error });
  }
}

 static async updateCommandById(req, res) {
  const { id } = req.params;
  const updateFields = req.body;

  try {
    const updatedCommand = await Command.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedCommand) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    res.status(200).json(updatedCommand);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la commande:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour", error });
  }
}

static async sendDevisEmail(req, res) {
  try {
    const { email, pdf, commandNum, phone, clientName,
      societeName, code, description } = req.body;

   

    if (!email || !pdf) {
      return res.status(400).json({ message: 'Email and PDF are required.' });
    }

    // Extract base64 data and convert to Buffer
    const base64Data = pdf.split(';base64,').pop();
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    // Configure your email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Or another SMTP provider
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS, // your email password or app password
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Envoi de votre devis – ${code}`,
      html: `
        <p>Bonjour ${clientName},</p>
      
        <p>Comme convenu, vous trouverez ci-joint le devis correspondant à la prestation suivante : <strong>${description}</strong>.</p>
      
        <p>Ce devis détaille l’ensemble des prestations proposées ainsi que les conditions tarifaires. N’hésitez pas à me faire part de vos questions ou remarques si certains points nécessitent des précisions.</p>
      
        <p>Je reste bien entendu disponible pour en discuter ensemble.</p>
      
        <p>Dans l’attente de votre retour,<br/>
        Bien cordialement,</p>
      
        <p>${clientName}<br/>
        ${societeName}<br/>
        ${phone}<br/>
        ${email}</p>
      `,
      attachments: [
        {
          filename: `Devis-${commandNum}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Le devis a été envoyé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l’envoi du devis :', error);
    res.status(500).json({ message: 'Erreur serveur lors de l’envoi du devis.' });
  }
}

static async sendFactureEmail(req, res) {
  try {
    const { email, pdf, commandNum, phone, societeName, montantTTC, description, code, montantHT, clientName, date } = req.body;

    // const formattedDate = new Date(date).toISOString().split('T')[0];
    const dueDate = new Date(date);
dueDate.setDate(dueDate.getDate() + 7);
const formattedDate = dueDate.toISOString().split('T')[0];

    if (!email || !pdf) {
      return res.status(400).json({ message: 'Email and PDF are required.' });
    }

    // Extract base64 data and convert to Buffer
    const base64Data = pdf.split(';base64,').pop();
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    // Configure your email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Or another SMTP provider
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS, // your email password or app password
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: ` Facture ${commandNum} – ${code}`,
      html: `
  <p>Bonjour ${clientName},</p>

  <p>Veuillez trouver ci-joint la facture correspondant à <strong>${description}</strong> réalisée pour <strong>${societeName || 'votre projet'}</strong>.</p>

  <p>Le montant total est de <strong>montant HT: ${montantHT}€ et montant TTC: ${montantTTC}€</strong>, avec une échéance de règlement au <strong>${formattedDate}</strong>.</p>

  <p>N’hésitez pas à me contacter si vous avez besoin d’informations complémentaires ou si vous souhaitez échanger à ce sujet.</p>

  <p>Merci encore pour votre confiance,<br/>
  Bien cordialement,</p>

  <p>${clientName}<br/>
  ${societeName}<br/>
  ${phone}<br/>
  ${email}</p>
`,
      attachments: [
        {
          filename: `Facture-${commandNum}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Le devis a été envoyé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l’envoi du devis :', error);
    res.status(500).json({ message: 'Erreur serveur lors de l’envoi du devis.' });
  }
}


}

module.exports = ProgramController;
