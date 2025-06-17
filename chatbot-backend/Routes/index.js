const { Router } = require('express');
const AppController = require('../Controllers/AppController');
const AuthenticationController = require('../Controllers/AuthenticationController');
const DataController = require('../Controllers/DataController');
const AffectationLeadController = require('../Controllers/AffectationLeadController');
const AdminController = require('../Controllers/AdminController');
const ManagerController = require('../Controllers/ManagerController');
const ProgramController = require('../Controllers/ProgramControlle');
const ProduitController = require('../Controllers/ProduitController');
const PanierController = require('../Controllers/PanierController');
const verifyToken = require('../middleware/verifyToken');
const router = Router();

router.get("/", AppController.test);

router.post('/login', AuthenticationController.login);
router.post('/register', AuthenticationController.register);
router.post('/logout', AuthenticationController.logout);
router.get('/profile', AuthenticationController.Getprofile);

// commercial routes
router.post('/commercials', AuthenticationController.createCommercial);
router.get('/commercials', AuthenticationController.getAllCommercials);
router.delete("/commercials/:id", AuthenticationController.deleteCommercialById);
router.put('/commercials/:id', AuthenticationController.updateCommercialById);
router.get('/commercials/:id', AuthenticationController.getCommercialById);

// manager routes
router.post('/manager', ManagerController.createManager);
router.get('/manager', ManagerController.getAllManager);
router.delete("/manager/:id", ManagerController.deleteManagerById);
router.put('/manager/:id', ManagerController.updateManagerById);
router.get('/manager/:id', ManagerController.getManagerById);

// affectaion de lead a un commercial
router.post("/assign-leads", AffectationLeadController.affectLead);
router.get('/assigned/:commercialId',  AffectationLeadController.getLeadsByCommercial);
router.post('/unassign-leads', AffectationLeadController.desaffectLead);

//Admin routes
router.post('/admin', AdminController.createAdmin);
router.get('/admin', AdminController.getAllAdmins);
router.get('/admin/:id', AdminController.getAdminById);
router.put('/admin/:id', AdminController.updateAdminById);
router.delete('/admin/:id', AdminController.deleteAdminById);

router.post('/data', DataController.data);
router.get('/data', DataController.getdata);
router.get('/lead/:id', DataController.getdataById);
router.put('/lead/:id', DataController.updateDataById);
router.delete("/lead/:id", DataController.deleteDataById);
router.get("/search", DataController.searchData);
router.put('/updateStatusLead/:id', DataController.updateStatusLead);
router.put('/add-comment/:id', DataController.addComment);
router.delete('/lead/:id/delete-comment/:commentId', DataController.deleteComment);


// routes for program
// router.post('/program', ProgramController.createProgram);
// router.get('/program', ProgramController.getAllPrograms);
// router.get('/program/:id', ProgramController.getProgramById);
// router.put('/program/:id', ProgramController.updateProgramById);
// router.delete('/program/:id', ProgramController.deleteProgramById);

// calendar routes

router.post('/events', ProgramController.createEvent);
router.get('/events/:id', verifyToken, ProgramController.getAllEvents);
router.get("/events", verifyToken, ProgramController.getAllEventsBySession)
router.delete('/event/:id', ProgramController.deleteEvent);

// Command routes
router.post('/command', ProgramController.createCommand);
router.get('/command',  ProgramController.getAllsCommands);
router.get('/command/:id', verifyToken, ProgramController.getAllCommands);
router.get('/commands/:commandId', ProgramController.getCommandById);
router.put('/command/validate/:id', ProgramController.validateCommand);
router.delete('/command/:id', ProgramController.deleteCommandById);
router.put('/command/:id', ProgramController.updateCommandById);
router.post("/command/send-devis-email/:id", ProgramController.sendDevisEmail);
router.post("/command/send-facture-email/:id", ProgramController.sendFactureEmail);

// Produit routes
router.post('/produit', ProduitController.createProduit);
router.get('/produit', ProduitController.getAllProduits);
router.get('/produits/:id', verifyToken, ProduitController.getAllProduits);
router.get('/produit/:id', ProduitController.getProduitById);
router.put('/produit/:id', ProduitController.updateProduitById);
router.delete('/produit/:id', ProduitController.deleteProduitById);


// Panier routes
router.post('/panier', PanierController.createPanier);
router.delete('/panier/:panierId', PanierController.deletePanierById);
router.get('/panier/:id', verifyToken, PanierController.getAllPanier);
router.put('/panier/:panierId', PanierController.updatePanierItem);


// import leads routes
router.post('/import', DataController.importLeads);

router.get('/tickets', DataController.getAllTickets);
router.post('/tickets', verifyToken, DataController.createTicket);
router.put('/tickets/:id', verifyToken, DataController.updateTicket);
router.get('/tickets/:id', DataController.getTicketById);
router.delete('/tickets/:id', DataController.deleteTicket);



module.exports = router;