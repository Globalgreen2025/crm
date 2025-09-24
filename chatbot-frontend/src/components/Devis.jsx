import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Table, Space, message, Card, Descriptions, Modal, Tag } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { jwtDecode } from "jwt-decode";

const Devis = ({ onValidate, shouldRefresh }) => {
  const [commands, setCommands] = useState([]);
  const { id } = useParams(); // Assuming leadId is part of the route parameter
  const navigate = useNavigate();
  const [selectedCommand, setSelectedCommand] = useState(null);

  const handleDelete = (commandId) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer cette commande ?",
      content: "Cette action est irréversible.",
      okText: "Oui",
      cancelText: "Non",
      onOk: async () => {
        try {
          await axios.delete(`/command/${commandId}`);
          setCommands((prev) => prev.filter((cmd) => cmd._id !== commandId));
          message.success("Commande supprimée avec succès !");
        } catch (err) {
          console.error(err);
          message.error("Erreur lors de la suppression");
        }
      },
    });
  };

  const handleUpdate = (commandId) => {
    navigate(`/leads/${id}/create-command/${commandId}`, {
      state: { commandId },
    });
  };


  const handleValidate = async (commandId) => {
    try {
      // Find the command to update
      const currentCommand = commands.find(
        (command) => command._id === commandId
      );
      if (!currentCommand) {
        console.error("Commande non trouvée");
        return;
      }

      // Replace only the first character from D to C
      const oldNumCommand = currentCommand.numCommand;
      const newNumCommand = "F" + oldNumCommand.slice(1);

      console.log("Old numCommand:", oldNumCommand);
      console.log("New numCommand:", newNumCommand);

      // Update the command via API
      const response = await axios.put(`/command/validate/${commandId}`, {
        ...currentCommand,
        command_type: "facture", // Change command type to 'facture'
        numCommand: newNumCommand,
        originalNumCommand: oldNumCommand,
      });

      console.log("Updated Command Response:", response.data);

      // Remove command from the list in UI
      setCommands((prevCommands) =>
        prevCommands.filter((command) => command._id !== commandId)
      );

      message.success("Commande validée avec succès !");
      onValidate();
    } catch (error) {
      console.error("Error validating command:", error);
      message.error("❌ Échec de la validation de la commande.");
    }
  };

  const fetchCommands = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await axios.get(`/command/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Response dataaaaa:", response.data);
      const commandsData = response?.data;
      const decodedToken = token ? jwtDecode(token) : null;
      const currentUserId = decodedToken?.userId;

      const filterecommand = commandsData.filter(
        (cmd) => cmd.session === currentUserId
      );
      const filteredCommands = filterecommand.filter(
        (command) =>
          command.command === "devis" && command.lead.toString() === id
      );
      setCommands(filteredCommands);
    } catch (error) {
      console.error("Error fetching commands:", error);
    }
  };

  // useEffect(() => {
  //   fetchCommands();
  // }, [id]);
  useEffect(() => {
    if (shouldRefresh) {
      fetchCommands();
    }
  }, [shouldRefresh, id]);

  function stringToColor(str) {
    // List of distinct Ant Design tag colors
    const colors = [
      'magenta', 'red', 'volcano', 'orange', 'gold',
      'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple'
    ];
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }


  const safeRender = (value, fallback = "N/A") => {
    return value !== undefined && value !== null ? value : fallback;
  };

  const columns = [
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: "Titre",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Type de Commande",
      dataIndex: "command",
      key: "command",
    },

    {
      title: "Quantité",
      dataIndex: "quantite",
      key: "quantite",
      render: (text) => `${text}`, // Formatting the price
    },

    // {
    //   title: "Prix HT",
    //   dataIndex: "totalHT",
    //   key: "totalHT",
    //   render: (text) => `${text} €`, // Formatting the price
    // },
    // {
    //   title: "TVA (10%)",
    //   dataIndex: "totalTVA",
    //   key: "totalTVA",
    //   render: (text) => `${text} €`, // Formatting the TVA
    // },
    // {
    //   title: 'Marge',
    //   dataIndex: 'marge',
    //   key: 'marge',
    //   render: (text) => `${text} €`,
    // },
    // {
    //   title: "Prix TTC",
    //   dataIndex: "totalTTC",
    //   key: "totalTTC",
    //   render: (text) => `${text} €`, // Formatting the price
    // },
        {
              title: "Forfait",
              dataIndex: "forfait",
              key: "forfait",
              render: (text, record) => (
                <div className="flex flex-col gap-1">
                  {/* Main Forfait Tag - Only shows if value exists */}
                  {text && parseFloat(text) !== 0 && (
                    <Tag color="#f50" className="text-xs font-medium">
                      Forfait: {parseFloat(text).toFixed(2)} €
                    </Tag>
                  )}
            
                  {/* Item-Level Forfaits - Only shows if items with forfait exist */}
                  {record.items?.some(item => item.forfait) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {record.items
                        .filter(item => item.forfait)
                        .map((item, index) => (
                          <Tag
                            key={`forfait-${index}`}
                            color="#f50"
                            className="text-xs font-medium"
                          >
                            Forfait: {parseFloat(item.forfait || 0).toFixed(2)} €
                            {item.quantite > 1 && (
                              <span className="font-bold ml-1">(x{item.quantite})</span>
                            )}
                          </Tag>
                        ))}
                    </div>
                  )}
                </div>
              ),
            },
            {
              title: "Total HT",
              dataIndex: "totalHT",
              key: "totalHT",
              render: (text, record) => (
                <div className="text-right">
                  <div>{`${safeRender(text, "0")} €`}</div>
                  {record.items?.length > 0 ? (
                    <div className="text-xs text-gray-500">
                      {record.items.map(item => item.montantHT + '€').join(' + ')}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      {safeRender(text, "0")} € 
                    </div>
                  )}
                </div>
              ),
              sorter: (a, b) => (a.totalHT || 0) - (b.totalHT || 0),
            },
            {
              title: "Total TVA",
              dataIndex: "totalTVA",
              key: "totalTVA",
              render: (text, record) => (
                <div className="text-right">
                  <div>{`${safeRender(text, "0")} €`}</div>
                  {record.items?.length > 0 ? (
                    <div className="text-xs text-gray-500">
                      {record.items.map(item => item.montantTVA + '€').join(' + ')}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      {safeRender(text, "0")} € 
                    </div>
                  )}
                </div>
              ),
              sorter: (a, b) => (a.totalTVA || 0) - (b.totalTVA || 0),
            },
            {
              title: "Prix Total TTC",
              dataIndex: "totalTTC",
              key: "totalTTC",
              render: (text, record) => (
                <div className="text-right">
                  <div className="font-medium">{`${safeRender(text, "0")} €`}</div>
                  {record.items?.length > 0 ? (
                    <div className="text-xs text-gray-500">
                      {record.items.map(item => item.montantTTC + '€').join(' + ')}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      {safeRender(text, "0")} € 
                    </div>
                  )}
                </div>
              ),
              sorter: (a, b) => (a.totalTTC || 0) - (b.totalTTC || 0),
            },
    {
      title: "Date de Création",
      dataIndex: "date",
      key: "date",
      render: (text) => new Date(text).toLocaleDateString("fr-FR"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Space size="middle">
          <EditOutlined
            className="text-blue-500 cursor-pointer"
            onClick={() => handleUpdate(record._id)}
          />
          <DeleteOutlined
            className="text-red-500 cursor-pointer"
            onClick={() => handleDelete(record._id)}
          />
          {/* <CheckCircleOutlined
            className="text-green-500 cursor-pointer"
            onClick={() => handleValidate(record._id)}
          /> */}
          {/* <SearchOutlined
            className="text-green-500 cursor-pointer"
            onClick={() => handleViewDetails(record._id)}
          /> */}
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full max-w-6xl px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Devis Récemment Ajoutées
      </h2>

      {/* Table to display commands */}
      <Table
        columns={[
          ...columns.map((col) => ({
            ...col,
            title: (
              <div className="flex flex-col items-center">
                <div className="text-xs">{col.title}</div>
              </div>
            ),
          })),
        ]}
        dataSource={commands}
        rowKey="_id"
        pagination={false} // You can enable pagination if needed
      />
      {selectedCommand && (
        <Card
          title={`Détails de la commande: ${selectedCommand.code}`}
          className="mt-8 shadow-md"
          bordered
        >
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Type">
              {selectedCommand.command}
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {new Date(selectedCommand.date).toLocaleDateString("fr-FR")}
            </Descriptions.Item>
            <Descriptions.Item label="Nom">
              {selectedCommand.nom}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedCommand.email}
            </Descriptions.Item>
            <Descriptions.Item label="Téléphone">
              {selectedCommand.phone}
            </Descriptions.Item>
            <Descriptions.Item label="SIRET">
              {selectedCommand.siret}
            </Descriptions.Item>
            <Descriptions.Item label="Code Postal">
              {selectedCommand.codepostal}
            </Descriptions.Item>
            <Descriptions.Item label="Ville">
              {selectedCommand.ville}
            </Descriptions.Item>
            <Descriptions.Item label="Adresse">
              {selectedCommand.address}
            </Descriptions.Item>
            <Descriptions.Item label="Raison Sociale">
              {selectedCommand.raissociale}
            </Descriptions.Item>
            {/* <Descriptions.Item label="Description" span={2}>
              {selectedCommand.description}
            </Descriptions.Item> */}
            <Descriptions.Item label="Description" span={2}>
              <div style={{ lineHeight: "1.5" }}>
                {selectedCommand.description?.map((desc, index) => (
                  <div key={index} style={{ display: "flex", marginBottom: 4 }}>
                    <span style={{ marginRight: 8 }}>•</span>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Quantité">
              {selectedCommand.quantite}
            </Descriptions.Item>
            <Descriptions.Item label="Total HT">
              {selectedCommand.totalHT} €
            </Descriptions.Item>
            <Descriptions.Item label="Total TVA (5.5%)">
              {selectedCommand.totalTVA} €
            </Descriptions.Item>
            <Descriptions.Item label="Total TTC">
              {selectedCommand.totalTTC} €
            </Descriptions.Item>
            <Descriptions.Item label="Numéro de Commande">
              {selectedCommand.originalNumCommand}
            </Descriptions.Item>
            <Descriptions.Item label="Titre">
              <div style={{ lineHeight: "1.5" }}>
                {selectedCommand.code?.map((code, index) => (
                  <div key={index} style={{ display: "flex", marginBottom: 4 }}>
                    <span style={{ marginRight: 8 }}>•</span>
                    <span>{code}</span>
                  </div>
                ))}
              </div>
            </Descriptions.Item>
            {/* <Descriptions.Item label="Code">
              {selectedCommand.code}
            </Descriptions.Item> */}
            {/* <Descriptions.Item label="Marque">{selectedCommand.marque}</Descriptions.Item> */}
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default Devis;
