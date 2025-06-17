const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Admin } = require("../Models/adminModel");
const mongoose = require("mongoose");
const CommercialSchema = require("../Models/commercialModel");
const ManagerSchema = require("../Models/managerModel");

// encrypting passwords
const bcryptSalt = bcrypt.genSaltSync(10);

// Function to log details for debugging bcrypt
const debugBcrypt = async (plainTextPassword, hashedPassword) => {
  const match = await bcrypt.compare(plainTextPassword, hashedPassword);
  console.log(
    `Comparing passwords: entered: ${plainTextPassword}, stored (hashed): ${hashedPassword}, match: ${match}`
  );

  const manuallyHashedPassword = await bcrypt.hash(plainTextPassword, 10);
  console.log(`Manually hashed entered password: ${manuallyHashedPassword}`);

  const manualMatch = manuallyHashedPassword === hashedPassword;
  console.log(`Manual match: ${manualMatch}`);

  return match;
};

class AuthenticationController {
  static async login(req, res) {
   
    try {
      console.log("Request body:", req.body);

      const manager = await ManagerSchema.findOne({ email: req.body.email });
      if (manager) {
        const match = await debugBcrypt(req.body.password, manager.password);
  
        if (!match) {
          return res
            .status(401)
            .json({ message: "Incorrect manager password" });
        }
  
        const token = jwt.sign(
          {
            userId: manager._id,
            role: "Manager",
            name: manager.nom + " " + manager.prenom,
          },
          process.env.JWT_SECRET || "default_secret_key",
          { expiresIn: "72h" }
        );

        return res.json({ token });
      
      }
  
      const commercial = await CommercialSchema.findOne({ email: req.body.email });
      if (commercial) {
        const match = await debugBcrypt(req.body.password, commercial.password);
  
        if (!match) {
          return res
            .status(401)
            .json({ message: "Incorrect commercial password" });
        }
  
        const token = jwt.sign(
          {
            userId: commercial._id,
            role: "Commercial",
            name: commercial.nom + " " + commercial.prenom,
          },
          process.env.JWT_SECRET || "default_secret_key",
          { expiresIn: "72h" }
        );
        // console.log('Commercial login successful:', token);
        return res.json({ token });
      
      }
  
      const admin = await Admin.findOne({ email: req.body.email });
      if (!admin) {
        // console.log('Admin not found');
        return res.status(401).json({ message: "Incorrect email or password" });
      }
  
      const match = await debugBcrypt(req.body.password, admin.password);
  
      if (!match) {
        return res.status(401).json({ message: "Incorrect admin password" });
      }
  
      const token = jwt.sign(
        {
          userId: admin._id,
          role: "Admin",
          name: admin.name,
        },
        process.env.JWT_SECRET || "default_secret_key",
        { expiresIn: "24h" }
      );
      // console.log('Admin login successful:', token);
      return res.json({ token });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  static async register(req, res) {
    const { name, email, password } = req.body;
    // Check for missing fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    try {
      const userDoc = await Admin.create({
        name,
        email,
        password: bcrypt.hashSync(password, bcryptSalt),
      });
      res.json(userDoc);
    } catch (e) {
      res.status(422).json(e);
    }
  }

  static async logout(req, res) {
    res.clearCookie("token").send("Logged out");
  }

  static async Getprofile(req, res) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { name, email, _id } = await Admin.findById(decoded.userId);
      res.json({ name, email, _id });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }

  static createCommercial = async (req, res) => {
    const { nom, prenom, email, phone, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newCommercial = new CommercialSchema({
        nom,
        prenom,
        email,
        phone,
        password: hashedPassword,
      });
      const savedCommercial = await newCommercial.save();
      res.status(201).json(savedCommercial);
    } catch (error) {
      res
        .status(400)
        .json({
          message: "Erreur lors de la création du commercial",
          details: error.message,
        });
    }
  };

  // Récupérer tous les commerciaux
  static getAllCommercials = async (req, res) => {
    try {
      const commercials = await CommercialSchema.find();
      res.status(200).json(commercials);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Erreur serveur", details: error.message });
    }
  };

  // Récupérer un commercial par son ID

  static getCommercialById = async (req, res) => {
    try {
      const commercial = await CommercialSchema.findById(req.params.id);
      console.log("commercial", commercial);
      if (!commercial) {
        return res.status(404).json({ message: "Commercial not found" });
      }
      res.json(commercial);
    } catch (error) {
      res.status(500).json({ message: "Error fetching commercial", error });
    }
  };

  // Mettre à jour un commercial par son ID
  // static updateCommercialById = async (req, res) => {
  //   const { id } = req.params;
  //   const { nom, prenom, email, phone, password, status } = req.body;
  //   console.log("Update request body:", req.body);

  //   try {
  //     const updateData = { nom, prenom, email, phone };
  //     if (password) {
  //       const hashedPassword = await bcrypt.hash(password, 10);
  //       updateData.password = hashedPassword;
  //     }

  //     const updatedCommercial = await CommercialSchema.findByIdAndUpdate(
  //       id,
  //       updateData,
  //       { status, lastActivity: new Date() },
  //       { new: true }
  //     );
  //     console.log("Updated commercial:", updatedCommercial);

  //     if (!updatedCommercial) {
  //       return res.status(404).json({ message: "Commercial non trouvé" });
  //     }

  //     res.status(200).json(updatedCommercial);
  //   } catch (error) {
  //     res
  //       .status(400)
  //       .json({
  //         message: "Erreur lors de la mise à jour du commercial",
  //         details: error.message,
  //       });
  //   }
  // };
  static updateCommercialById = async (req, res) => {
    const { id } = req.params;
    const { nom, prenom, email, phone, password, status } = req.body;
    console.log("Update request body:", req.body);

    try {
        // Prepare update data
        const updateData = { 
            nom, 
            prenom, 
            email, 
            phone,
            status,  // Include status in the update
            lastActivity: new Date()  // Always update lastActivity
        };

        // Only update password if it's provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        // Correct usage of findByIdAndUpdate
        const updatedCommercial = await CommercialSchema.findByIdAndUpdate(
            id,
            updateData,  // Single object containing all updates
            { new: true, runValidators: true }  // Options object
        );
        
        console.log("Updated commercial:", updatedCommercial);

        if (!updatedCommercial) {
            return res.status(404).json({ message: "Commercial non trouvé" });
        }

        res.status(200).json(updatedCommercial);
    } catch (error) {
        res.status(400).json({
            message: "Erreur lors de la mise à jour du commercial",
            details: error.message,
        });
    }
};

  // Supprimer un commercial par son ID
  static deleteCommercialById = async (req, res) => {
    const { id } = req.params;
    try {
      const deletedCommercial = await CommercialSchema.findByIdAndDelete(id);
      if (!deletedCommercial) {
        return res.status(404).json({ message: "Commercial non trouvé" });
      }
      res.status(200).json({ message: "Commercial supprimé avec succès" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Erreur serveur", details: error.message });
    }
  };

  static changeStatus = async (req, res) => {
    const { id } = req.params;
    const { state } = req.body;
    try {
      const commercial = await Commercial.findById(id);
      if (!commercial) {
        return res.status(404).send("Commercial not found");
      }
      await commercial.updateOne({ state }); // Assuming state is the field you want to update
      res.status(200).send("Commercial status updated successfully");
    } catch (error) {
      res.status(500).send(error.message);
    }
  };
}

module.exports = AuthenticationController;
