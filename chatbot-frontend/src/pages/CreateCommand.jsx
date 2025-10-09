import { useForm } from "antd/es/form/Form";
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Radio,
  Button,
  message,
  DatePicker,
  Row,
  Col,
  Table,
  Tag,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const CreateCommand = () => {
  const [form] = useForm();
  const { id, commandId } = useParams();
  const { TextArea } = Input;

  const [leads, setLeads] = useState({});
  const TVA = 5.5;
  const [panierItems, setPanierItems] = useState([]);
  const navigate = useNavigate();

  const generateRandomNumber = (prefix) => {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // generates 6 random digits
    return `${prefix}${randomNum}`;
  };
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '0.00';
    return parseFloat(value).toFixed(2);
  };
  useEffect(() => {
    const fetchCartData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get(`/panier/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const allPanier = response.data;
        console.log("allPanier", allPanier);

        const decodedToken = token ? jwtDecode(token) : null;
        const currentUserId = decodedToken?.userId;

        const filteredpanier = allPanier.filter(
          (panier) => panier.userId === currentUserId
        );
        console.log("filteredpanier", filteredpanier);
        setPanierItems(filteredpanier);
        if (filteredpanier.length > 0) {
          const totals = filteredpanier.reduce(
            (acc, item) => ({
              quantite: acc.quantite + (item.quantite || 0),
              totalHT: acc.totalHT + (item.montantHT || 0),
              totalTVA: acc.totalTVA + (item.montantTVA || 0),
              totalTTC: acc.totalTTC + (item.montantTTC || 0),
              marge: acc.totalTTC + (item.marge || 0),
            }),
            { quantite: 0, totalHT: 0, totalTVA: 0, totalTTC: 0, marge: 0 }
          );

          form.setFieldsValue({
            // quantite: totals.quantite,
            // // Add other fields you want to populate:
            // totalHT: totals.totalHT,
            // totalTVA: totals.totalTVA,
            // totalTTC: totals.totalTTC,
            quantite: totals.quantite,
            totalHT: formatCurrency(totals.totalHT),
            totalTVA: formatCurrency(totals.totalTVA),
            totalTTC: formatCurrency(totals.totalTTC),
            marge: totals.marge,
            
          });
        }
      } catch (error) {
        console.error("Error trouver items", error);
        message.error("Error trouver items");
      }
    };
    fetchCartData();
  }, []);

  const handleCommandTypeChange = (value) => {
    const prefix = value === "devis" ? "D" : "F";
    const randomNumber = generateRandomNumber(prefix);
    form.setFieldsValue({
      numCommand: randomNumber,
    });
  };

  // const tableData = commandId ? commandData?.panierItems || [] : panierItems;

  useEffect(() => {
    const fetchCommand = async () => {
      if (commandId) {
        try {
          const response = await axios.get(`/commands/${commandId}`);
          const commandData = response.data;

          form.setFieldsValue({
            command_type: commandData.command_type,
            date: dayjs(commandData.date),
            nom: commandData.nom,
            email: commandData.email,
            phone: commandData.phone,
            siret: commandData.siret,
            codepostal: commandData.codepostal,
            raissociale: commandData?.raissociale,
            societe: commandData?.societe,
            ville: commandData.ville,
            adresse: commandData.adresse,
            quantite: commandData.quantite,
            // montantHT: commandData.montantHT || 0,
            // totalTTC: commandData.totalTTC || 0,
            // totalTVA: commandData.totalTVA || 0,
            montantHT: formatCurrency(commandData.montantHT || 0),
            totalTTC: formatCurrency(commandData.totalTTC || 0),
            totalTVA: formatCurrency(commandData.totalTVA || 0),
            numCommand: commandData.numCommand,
            naturePrestations: commandData.naturePrestations,
            note: commandData.note,
            // marge: commandData.marge,
          });
          const currentValues = form.getFieldsValue();
          console.log("Current form values:", currentValues);
        } catch (error) {
          console.error(
            "Erreur lors de la récupération de la commande:",
            error
          );
          message.error("Échec du chargement des données de commande.");
        }
      }
    };

    fetchCommand();
  }, [commandId]);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await axios.get(`/lead/${id}`);
        const foundLead = response.data.chat;
        setLeads(foundLead);
        if (foundLead) {
          form.setFieldsValue({
            nom: foundLead.nom,
            email: foundLead.email,
            phone: foundLead.phone,
            ville: foundLead.ville,
            codepostal: foundLead.codepostal,
            address: foundLead.address,
            societe: foundLead.societe,
            // raissociale: foundLead.raissociale,
            siret: foundLead.siret,
          });
        }
      } catch (error) {
        message.error("Failed to fetch lead.");
        console.error(error);
      }
    };
    fetchLead();
  }, [id]);
  const handleFormSubmit = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const decodedToken = token ? jwtDecode(token) : null;
      const commercialName = decodedToken?.name || decodedToken?.commercialName;
  
      if (!decodedToken) {
        alert("User not authenticated");
        return;
      }
  
      const userId = decodedToken?.userId || decodedToken?.commercialId;
  
      // Calculate totals
      const totalHT = panierItems.reduce(
        (acc, item) => acc + (item.montantHT || 0),
        0
      );
      const totalTVA = panierItems.reduce(
        (acc, item) => acc + (item.montantTVA || 0),
        0
      );
      const totalTTC = panierItems.reduce(
        (acc, item) => acc + (item.montantTTC || 0),
        0
      );
      const totalQuantity = panierItems.reduce(
        (acc, item) => acc + (item.quantite || 0),
        0
      );
  
      // CORRECTION ICI - Nettoyer les descriptions
      const cleanDescriptions = panierItems
        .map((item) => {
          if (!item.description) return null;
          // Supprimer les \n au début et à la fin, et nettoyer les espaces
          return item.description.trim().replace(/^\n+|\n+$/g, '');
        })
        .filter(Boolean);
  
      const formData = {
        ...values,
        session: userId,
        leadId: id,
        commercialName,
        description: cleanDescriptions.join("\n\n"), // Maintenant propre
        title: panierItems
          .map((item) => item.title)
          .filter(Boolean)
          .join(", "),
        category: panierItems.map((item) => item.category).join(", "),
        reference: panierItems.map((item) => item.reference).join(", "),
        totalHT,
        totalTVA,
        totalTTC,
        quantite: totalQuantity,
        items: panierItems.map((item) => ({
          produit: item.produit,
          title: item.title,
          description: item.description ? item.description.trim().replace(/^\n+|\n+$/g, '') : '', // Nettoyer aussi dans items
          reference: item.reference,
          category: item.category,
          quantite: item.quantite,
          prixUnitaire: item.total,
          montantHT: item.montantHT,
          montantTVA: item.montantTVA,
          montantTTC: item.montantTTC,
          tva: item.tva,
          forfait: item.forfait,
          date: item.date,
        })),
      };
  
      console.log('FormData description:', formData.description); // Vérifiez le résultat
  
      if (!commandId) {
        await axios.post("/command", formData);
        message.success("Commande ajoutée avec succès !");
      } else {
        const res = await axios.put(`/command/${commandId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Update response:', res.data);
        message.success("Commande mise à jour avec succès !");
      }
  
      navigate(`/lead/${id}`);
    } catch (error) {
      message.error("Erreur lors de l'envoi de la commande.");
      console.error('Error details:', error.response?.data || error.message);
    }
  };
  // const handleFormSubmit = async (values) => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const decodedToken = token ? jwtDecode(token) : null;
  //     const commercialName = decodedToken?.name || decodedToken?.commercialName;
  
  //     if (!decodedToken) {
  //       alert("User not authenticated");
  //       return;
  //     }
  
  //     const userId = decodedToken?.userId || decodedToken?.commercialId;
  
  //     // Calculate totals (COMMON FOR BOTH CREATE AND UPDATE)
  //     const totalHT = panierItems.reduce(
  //       (acc, item) => acc + (item.montantHT || 0),
  //       0
  //     );
  //     const totalTVA = panierItems.reduce(
  //       (acc, item) => acc + (item.montantTVA || 0),
  //       0
  //     );
  //     const totalTTC = panierItems.reduce(
  //       (acc, item) => acc + (item.montantTTC || 0),
  //       0
  //     );
  //     const totalQuantity = panierItems.reduce(
  //       (acc, item) => acc + (item.quantite || 0),
  //       0
  //     );
  
  //     // Prepare formData (COMMON FOR BOTH CREATE AND UPDATE)
  //     const formData = {
  //       ...values,
  //       session: userId,
  //       leadId: id,
  //       commercialName,
  //       description: panierItems
  //         .map((item) => item.description)
  //         .filter(Boolean),
  //       title: panierItems
  //         .map((item) => item.title)
  //         .filter(Boolean)
  //         .join(", "),
  //       category: panierItems.map((item) => item.category).join(", "),
  //       reference: panierItems.map((item) => item.reference).join(", "),
  //       totalHT,
  //       totalTVA,
  //       totalTTC,
  //       quantite: totalQuantity,
  //       items: panierItems.map((item) => ({
  //         produit: item.produit,
  //         title: item.title,
  //         description: item.description,
  //         reference: item.reference,
  //         category: item.category,
  //         quantite: item.quantite,
  //         prixUnitaire: item.total,
  //         montantHT: item.montantHT,
  //         montantTVA: item.montantTVA,
  //         montantTTC: item.montantTTC,
  //         tva: item.tva,
  //         forfait: item.forfait,
  //         date: item.date,
  //       })),
  //     };
  
  //     console.log('FormData being sent:', formData); // AJOUTEZ CE LOG
  
  //     if (!commandId) {
  //       // CREATE
  //       await axios.post("/command", formData);
  //       message.success("Commande ajoutée avec succès !");
  //     } else {
  //       // UPDATE - CORRECTION ICI
  //       const res = await axios.put(`/command/${commandId}`, formData, {
  //         headers: { Authorization: `Bearer ${token}` }
  //       });
  //       console.log('Update response:', res.data);
  //       message.success("Commande mise à jour avec succès !");
  //     }
  
  //     navigate(`/lead/${id}`);
  //   } catch (error) {
  //     message.error("Erreur lors de l'envoi de la commande.");
  //     console.error('Error details:', error.response?.data || error.message);
  //   }
  // };
  // const handleFormSubmit = async (values) => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const decodedToken = token ? jwtDecode(token) : null;
  //     const commercialName = decodedToken?.name || decodedToken?.commercialName;

  //     if (!decodedToken) {
  //       alert("User not authenticated");
  //       return;
  //     }

  //     const userId = decodedToken?.userId || decodedToken?.commercialId;

  //     let formData;

  //     if (!commandId) {
  //       // Calculate totals
  //       const totalHT = panierItems.reduce(
  //         (acc, item) => acc + (item.montantHT || 0),
  //         0
  //       );
  //       const totalTVA = panierItems.reduce(
  //         (acc, item) => acc + (item.montantTVA || 0),
  //         0
  //       );
  //       const totalTTC = panierItems.reduce(
  //         (acc, item) => acc + (item.montantTTC || 0),
  //         0
  //       );
  //       const totalQuantity = panierItems.reduce(
  //         (acc, item) => acc + (item.quantite || 0),
  //         0
  //       );

  //       formData = {
  //         ...values,
  //         session: userId,
  //         leadId: id,
  //         commercialName,
  //         description: panierItems
  //           .map((item) => item.description)
  //           .filter(Boolean)
  //           .join("\n\n"),
  //         title: panierItems
  //           .map((item) => item.title)
  //           .filter(Boolean)
  //           .join(", "),
  //         category: panierItems.map((item) => item.category).join(", "),
  //         reference: panierItems.map((item) => item.reference).join(", "),
  //         totalHT,
  //         totalTVA,
  //         totalTTC,
  //         quantite: totalQuantity, // Total quantity
  //         items: panierItems.map((item) => ({
  //           produit: item.produit,
  //           title: item.title,
  //           description: item.description,
  //           reference: item.reference,
  //           category: item.category,
  //           quantite: item.quantite, // Individual quantity
  //           prixUnitaire: item.total,
  //           montantHT: item.montantHT,
  //           montantTVA: item.montantTVA,
  //           montantTTC: item.montantTTC,
  //           tva: item.tva,
  //           forfait: item.forfait,
  //           date: item.date,
  //         })),
  //       };

  //       await axios.post("/command", formData);
  //       message.success("Commande ajoutée avec succès !");
  //     } else {
  //       const res = await axios.put(`/command/${commandId}`, formData, {
  //         headers: { Authorization: `Bearer ${token}` }
  //       });
  //       console.log('Update response:', res.data);
  //       message.success("Commande mise à jour avec succès !");
  //     }

  //     navigate(`/lead/${id}`);
  //   } catch (error) {
  //     message.error("Erreur lors de l'envoi de la commande.");
  //     console.error(error);
  //   }
  // };
  return (
    <div className="p-12">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormSubmit}
        className="space-y-4 border p-12 rounded-md shadow-md bg-white"
      >
        <div className="flex items-center justify-center mr-6">
          <Form.Item
            name="command_type"
            className="font-bold"
            rules={[{ required: true, message: "Type de commande est requis" }]}
          >
            <Radio.Group
              onChange={(e) => handleCommandTypeChange(e.target.value)}
            >
              <Radio value="devis">Devis</Radio>
              {/* <Radio value="facture">Facture</Radio> */}
            </Radio.Group>
          </Form.Item>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Numéro de Commande"
              name="numCommand"
              rules={[
                { required: true, message: "Numéro de commande est requis" },
              ]}
            >
              <Input disabled />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true, message: "La date est requise" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Sélectionnez une date"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Prénom et Nom"
              name="nom"
              rules={[{ required: false, message: "Le prénom est requis" }]}
            >
              <Input placeholder="Prénom du client" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Adresse"
              name="address"
              rules={[{ required: false, message: "L'adresse est requis" }]}
            >
              <TextArea placeholder="Adresse" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "L'email est requis" }]}
            >
              <Input placeholder="Email du client" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Téléphone"
              name="phone"
              rules={[{ required: false, message: "Le téléphone est requis" }]}
            >
              <Input placeholder="Téléphone du client" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="TVA">
              <Input value={`${TVA}%`} disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Siret"
              name="siret"
              rules={[{ required: false, message: "Ce champ est requis" }]}
            >
              <Input placeholder="Siret" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Code Postal"
              name="codepostal"
              rules={[{ required: false, message: "Code postal est requis" }]}
            >
              <Input placeholder="Code Postal" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Raissociale"
              name="raissociale"
              rules={[{ required: false, message: "Raissociale est requis" }]}
            >
              <Input placeholder="Raissociale" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Ville"
              name="ville"
              rules={[{ required: false, message: "La ville est requis" }]}
            >
              <Input placeholder="Ville" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Quantité"
              name="quantite"
              rules={[{ required: false, message: "Ce champ est requis" }]}
            >
              <Input placeholder="Quantité" readOnly />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
        <Col span={12}>
            <Form.Item
              label="Societé"
              name="societe"
              rules={[{ required: false, message: "Societé est requis" }]}
            >
              <Input placeholder="Societé" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Montant HT"
              name="totalHT"
              rules={[{ required: false, message: "Montant HT est requis" }]}
            >
              <Input placeholder="Montant HT" readOnly />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Montant TTC"
              name="totalTTC"
              rules={[{ required: false, message: "Ce champ est requis" }]}
            >
              <Input placeholder="Montant TTC" readOnly />
            </Form.Item>
            <Form.Item
    label="Note"
    name="note"
  >
    <TextArea 
      placeholder="Ajoutez une note (facultatif) - Le texte sera automatiquement préfixé par 'Note :'"
      rows={3}
    />
  </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="total TVA"
              name="totalTVA"
              rules={[{ required: false, message: "Ce champ est requis" }]}
            >
              <Input placeholder="total TVA" readOnly />
            </Form.Item>
            <Form.Item
    label="Nature des prestations"
    name="naturePrestations"
    rules={[{ required: true, message: "La nature des prestations est requise" }]}
  >
    <TextArea 
      placeholder="Décrivez la nature des prestations à réaliser..." 
      rows={4}
    />
  </Form.Item>

  {/* Note - Optional with default prefix */}
 
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
              <Button
                type="primary"
                htmlType="submit"
                className="mt-8 text-xs bg-blue-600 text-white rounded-lg"
              >
                Enregistrer la commande
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default CreateCommand;
