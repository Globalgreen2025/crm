const Chat = require('../Models/LeadsSchema'); // Assuming this is the correct path
const Commande = require('../Models/commandSchema'); // Assuming this is the correct path


let hasRun = false; // Flag to track if migration has run

const migrateExistingClients = async () => {
  if (hasRun) return; // Prevent multiple runs
  
  try {
    console.log('Starting automatic client migration...');
    
    const leadIds = await Commande.distinct('lead', {
      command_type: 'commande'
    });

    if (leadIds.length === 0) {
      console.log('No leads with commands found - skipping migration');
      return;
    }

    const result = await Chat.updateMany(
      { 
        _id: { $in: leadIds },
        type: { $ne: 'client' }
      },
      { $set: { type: 'client' } }
    );

    console.log(`Migration complete: Updated ${result.modifiedCount} leads to client status`);
    hasRun = true;
  } catch (error) {
    console.error('Automatic migration failed:', error);
  }
};

module.exports = migrateExistingClients;