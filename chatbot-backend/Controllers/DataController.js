const Chat = require("../Models/LeadsSchema");
const mongoose = require("mongoose");
const Ticket = require("../Models/ticketModel");
const Commercial = require("../Models/commercialModel");
const Commande = require("../Models/commandSchema");

class DataController {
  
  static async data(req, res) {
    try {
      const data = new Chat(req.body);

      await data.save();

      res.status(201).json(data);
    } catch (error) {
      console.error("Error saving chat data:", error);
      res.status(500).json({ message: "Error saving chat data", error });
    }
  }

  // Retrieve chat data
  static async getdata(req, res) {
    try {
      // Retrieve all chat documents from the database
      const chatData = await Chat.find()
        .populate("commercial")
        .populate("manager");

      // Send the chat data back to the client
      res.status(200).json({ chatData });
    } catch (error) {
      console.error("Error retrieving chat data:", error);
      res.status(500).json({ message: "Error retrieving chat data", error });
    }
  }
  static async getdataById(req, res) {
    try {
      const { id } = req.params;
      // console.log("id", id)
      const chat = await Chat.findById(id).populate("commercial")
      .populate("manager");;

      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      res.status(200).json({ chat });
    } catch (error) {
      console.error("Error retrieving chat by ID:", error);
      res.status(500).json({ message: "Error retrieving chat by ID", error });
    }
  }
  static async updateDataById(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "ID is required" });
      }
      const updatedData = req.body;

      const chat = await Chat.findByIdAndUpdate(id, updatedData, { new: true });

      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      res.status(200).json({ chat });
    } catch (error) {
      console.error("Error updating chat:", error);
      res.status(500).json({ message: "Error updating chat", error });
    }
  }

  static async addComment(req, res) {
    const { id } = req.params; // Lead ID
    const { text, name } = req.body;
    console.log("Adding comment to lead:", id, "Comment:", text, "User:", name);
    if (!name) {
      return res
        .status(400)
        .json({ message: "Name is required for the comment" });
    }

    try {
      // Trouver le lead par ID
      const lead = await Chat.findById(id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Vérifier ou initialiser les commentaires
      if (!lead.commentaires) {
        lead.commentaires = [];
      }

      // Ajouter un nouveau commentaire
      const newComment = {
        text,
        addedBy: { name },
        addedAt: new Date(),
      };
      // lead.commentaires.push(newComment);
      lead.commentaires.unshift(newComment);

      // Sauvegarder le lead avec le nouveau commentaire
      await lead.save();

      return res
        .status(200)
        .json({
          message: "Comment added successfully",
          commentaires: lead.commentaires,
        });
    } catch (error) {
      console.error("Error adding comment:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  static async deleteDataById(req, res) {
    try {
      const { id } = req.params;
      const updatedData = req.body;

      const chat = await Chat.findByIdAndDelete(id, updatedData, { new: true });

      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      res.status(200).json({ message: "Chat deleted successfully", chat });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ message: "Error deleting chat", error });
    }
  }

  // static async searchData(req, res) {
  //   try {
  //     const { query, columnKey } = req.query;
  //     let filter = {};

  //     // Log to see the request params
  //     console.log("Received query:", query, "columnKey:", columnKey);

  //     if (!query || !columnKey) {
  //       return res
  //         .status(400)
  //         .json({ error: "Query and columnKey are required" });
  //     }
  //     if (columnKey === "createdAt") {
  //       // Convert the query to a Date object
  //       const dateQuery = new Date(query);
  //       if (!isNaN(dateQuery.getTime())) {
  //         // Search for documents created on that date (ignoring time)
  //         filter = {
  //           [columnKey]: {
  //             $gte: new Date(dateQuery.setHours(0, 0, 0, 0)), // Start of the day
  //             $lt: new Date(dateQuery.setHours(23, 59, 59, 999)), // End of the day
  //           },
  //         };
  //       } else {
  //         return res.status(400).json({ message: "Invalid date format." });
  //       }
  //     } else if (columnKey === "request_name") {
  //       filter = {
  //         $or: [
  //           { request_name: { $regex: query, $options: "i" } },
  //           { request_email: { $regex: query, $options: "i" } },
  //           { request_add_email: { $regex: query, $options: "i" } },
  //         ],
  //       };
  //     } else {
  //       // For other column keys, just search by the columnKey
  //       filter = { [columnKey]: { $regex: query, $options: "i" } };
  //     }
  //     // // Construct dynamic filter


  //     const results = await Chat.find(filter);

  //     res.status(200).json(results);
  //   } catch (error) {
  //     console.error("Error in search:", error);
  //     res.status(500).json({ error: "Internal Server Error" });
  //   }
  // }
  // static async searchData(req, res) {
  //   try {
  //     const { query, columnKey } = req.query;
  
  //     console.log("Received query:", query, "columnKey:", columnKey);
  
  //     if (!query || !columnKey) {
  //       return res
  //         .status(400)
  //         .json({ error: "Query and columnKey are required" });
  //     }
  
  //     let filter = {};
  //     const fieldType = Chat.schema.paths[columnKey]?.instance;
  
  //     if (columnKey === "createdAt") {
  //       const dateQuery = new Date(query);
  //       if (!isNaN(dateQuery.getTime())) {
  //         filter = {
  //           [columnKey]: {
  //             $gte: new Date(dateQuery.setHours(0, 0, 0, 0)),
  //             $lt: new Date(dateQuery.setHours(23, 59, 59, 999)),
  //           },
  //         };
  //       } else {
  //         return res.status(400).json({ message: "Invalid date format." });
  //       }
  //     } else if (fieldType === "String") {
  //       if (columnKey === "request_name") {
  //         filter = {
  //           $or: [
  //             { request_name: { $regex: query, $options: "i" } },
  //             { request_email: { $regex: query, $options: "i" } },
  //             { request_add_email: { $regex: query, $options: "i" } },
  //           ],
  //         };
  //       } else {
  //         filter = { [columnKey]: { $regex: query, $options: "i" } };
  //       }
  //     } else {
  //       return res
  //         .status(400)
  //         .json({ message: `${columnKey} is not a valid searchable field.` });
  //     }
  
  //     console.log("Constructed filter:", filter);
  
  //     const results = await Chat.find(filter);
  //     res.status(200).json(results);
  //   } catch (error) {
  //     console.error("Error in search:", error);
  //     res.status(500).json({ error: "Internal Server Error" });
  //   }
  // }


static async searchData(req, res) {
  try {
    const { query, columnKey } = req.query;

    if (!query || !columnKey) {
      return res.status(400).json({ error: "Query and columnKey are required" });
    }

    let filter = {};

    if (columnKey === "commercial") {
      // Populate the `commercial` field and search by its `nom` or `email`
      const results = await Chat.find()
        .populate({
          path: "commercial",
          match: {
            $or: [
              { prenom: { $regex: query, $options: "i" } },
              { nom: { $regex: query, $options: "i" } }
            ],
          },
        })
        .then((chats) => chats.filter((chat) => chat.commercial !== null)); // Filter out unmatched results

      return res.status(200).json(results);
    }

    const schemaPaths = Chat.schema.paths;

    if (!schemaPaths[columnKey]) {
      return res.status(400).json({ error: `Invalid columnKey: ${columnKey}` });
    }

    const fieldType = schemaPaths[columnKey].instance;

    if (fieldType === "String") {
      filter = { [columnKey]: { $regex: query, $options: "i" } };
    } else if (columnKey === "createdAt") {
      const dateQuery = new Date(query);
      if (!isNaN(dateQuery.getTime())) {
        filter = {
          [columnKey]: {
            $gte: new Date(dateQuery.setHours(0, 0, 0, 0)),
            $lt: new Date(dateQuery.setHours(23, 59, 59, 999)),
          },
        };
      } else {
        return res.status(400).json({ message: "Invalid date format." });
      }
    } else {
      return res.status(400).json({
        error: `Cannot apply regex to field ${columnKey} of type ${fieldType}`,
      });
    }

    const results = await Chat.find(filter);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error in search:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

  
  // static async updateStatusLead(req, res) {
  //   const { id } = req.params; // Get the lead's ID from the URL
  //   const { statusLead } = req.body; // Get the new statusLead from the request body

  //   // Validate the new status value
  //   const validStatuses = ["nouveau", "prospect", "client"]; // Define the valid statuses
  //   if (!validStatuses.includes(statusLead)) {
  //     return res.status(400).json({ error: "Invalid status value" });
  //   }

  //   try {
  //     // Find the lead by ID and update the 'type' field
  //     const updatedLead = await Chat.findByIdAndUpdate(
  //       id,
  //       { type: statusLead }, // Update the 'type' field
  //       { new: true } // Return the updated document
  //     );

  //     // If the lead is not found, return an error
  //     if (!updatedLead) {
  //       return res.status(404).json({ error: "Lead not found" });
  //     }

  //     // Return the updated lead as a response
  //     res.status(200).json(updatedLead);
  //   } catch (error) {
  //     console.error("Error updating lead:", error);
  //     res.status(500).json({ error: "Internal server error" });
  //   }
  // }
  static async updateStatusLead(req, res) {
    const { id } = req.params;
    const { statusLead } = req.body;
  
    // Validate the new status value
    const validStatuses = ["nouveau", "prospect", "client"];
    if (!validStatuses.includes(statusLead)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
  
    try {
      // Check if lead has any "commande" type commands
      const hasCommand = await Commande.exists({ 
        lead: id, 
        command_type: "commande" 
      });
  
      // Prevent downgrading a client with existing commands
      if (hasCommand && statusLead !== "client") {
        return res.status(400).json({ 
          error: "Cannot change status - lead has existing commands" 
        });
      }
  
      const updatedLead = await Chat.findByIdAndUpdate(
        id,
        { type: statusLead },
        { new: true }
      );
  
      if (!updatedLead) {
        return res.status(404).json({ error: "Lead not found" });
      }
  
      res.status(200).json(updatedLead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  static deleteComment = async (req, res) => {
    const { id, commentId } = req.params;
    console.log("Deleting comment:", commentId, "from chat:", id);

    try {
      // Find the chat document by its ID
      const chat = await Chat.findById(id);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      // Find the index of the comment by its commentId
      const commentIndex = chat.commentaires.findIndex(
        (comment) => comment._id.toString() === commentId
      );

      console.log("Comment index:", commentIndex);

      if (commentIndex === -1) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Remove the comment from the `commentaires` array
      chat.commentaires.splice(commentIndex, 1);

      // Save the updated chat document
      await chat.save();

      return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  };

  static async importLeads(req, res) {
    const leads = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ message: 'No leads provided for import' });
    }

    try {
        const existingPhones = await Chat.find({ 
            phone: { $in: leads.map(l => l.phone) } 
        }).select('phone -_id').lean();

        if (existingPhones.length > 0) {
            const existingPhoneNumbers = existingPhones.map(l => l.phone);
            return res.status(400).json({
                message: 'Some phone numbers already exist in database',
                duplicatePhones: existingPhoneNumbers
            });
        }

        // Step 4: Import with transaction for atomicity
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const importedLeads = await Chat.insertMany(leads, { session });
            await session.commitTransaction();
            
            return res.status(200).json({
                message: 'Leads imported successfully',
                count: importedLeads.length,
                leads: importedLeads
            });
        } catch (insertError) {
            await session.abortTransaction();
            throw insertError;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error('Error importing leads:', error.message);
        
        if (error.code === 11000) { // MongoDB duplicate key error
            const duplicateKey = error.keyValue?.phone || 'unknown';
            return res.status(400).json({
                message: `Duplicate phone number found: ${duplicateKey}`,
                error: 'DUPLICATE_KEY'
            });
        }
        
        return res.status(500).json({ 
            message: 'Error importing leads',
            error: error.message 
        });
    }
}


static async getAllTickets(req, res) {
  try {
    const tickets = await Ticket.find()
      .populate('client', 'nom phone email')
      .populate('commercial', 'nom prenom');
    res.send(tickets);
  } catch (error) {
    res.status(500).send();
  }
}

static async createTicket(req, res) {
  try {
    const { title, description, clientId, priority, createdBy } = req.body;
    
    // Validate required fields
    if (!title || !description || !clientId) {
      return res.status(400).json({ 
        success: false,
        message: 'Title, description, and client ID are required' 
      });
    }

    // Create the ticket
    const ticket = new Ticket({
      title,
      description,
      client: clientId,
      commercial: createdBy.role === 'Commercial' ? createdBy.id : null,
      createdBy: {
        user: createdBy.id,
        userType: createdBy.role,
        name: createdBy.name
      },
      priority: priority || 'medium',
      status: 'open'
    });

    // Save the ticket
    await ticket.save();

    // Add ticket reference to the client
    await Chat.findByIdAndUpdate(clientId, {
      $push: { tickets: ticket._id }
    });

    // Add ticket reference to the commercial if applicable
    if (createdBy.role === 'Commercial') {
      await Commercial.findByIdAndUpdate(createdBy.id, {
        $push: { tickets: ticket._id }
      });
    }

    // Populate the response
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('client', 'nom phone email')
      .populate('commercial', 'prenom nom');

    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: populatedTicket
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error while creating ticket',
      error: error.message 
    });
  }
}


// static async updateTicket(req, res) {
//   const updates = req.body;
  
//   try {
//     const ticket = await Ticket.findByIdAndUpdate(req.params.id, updates, { new: true });
    
//     if (updates.status === 'closed') {
//       ticket.closedAt = new Date();
//       ticket.closedBy = req.user._id;
//       await ticket.save();
//     }
    
//     res.send(ticket);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// }
static async updateTicket(req, res) {
  try {
    const updates = {
      status: req.body.status
    };
    
    if (req.body.status === 'closed') {
      updates.closedAt = new Date();
      updates.closedBy = req.userId;; 
    }
    
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id, 
      updates, 
      { new: true }
    );
    
    res.send(ticket);
  } catch (error) {
    console.error("Ticket update error:", error);
    res.status(400).send({ error: error.message });
  }
}


static async getTicketById(req, res) {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('client')
      .populate('commercial')
      .populate('comments.postedBy').populate('closedBy', 'name email')
      .populate('createdBy.user', 'name email');
    res.send(ticket);
  } catch (error) {
    res.status(500).send();
  }
}

static async deleteTicket(req, res) {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Remove ticket reference from client
    await Chat.findByIdAndUpdate(ticket.client, {
      $pull: { tickets: ticket._id }
    });

    // Remove ticket reference from commercial if applicable
    if (ticket.commercial) {
      await Commercial.findByIdAndUpdate(ticket.commercial, {
        $pull: { tickets: ticket._id }
      });
    }

    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ message: 'Server error while deleting ticket' });
  }
}
}

module.exports = DataController;
