
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { Form, Input, Select, Button, message } from "antd";
// import { jwtDecode } from "jwt-decode";
// import { Navigate, useParams } from "react-router-dom";

// const CreatePrograms = () => {
//   const [form] = Form.useForm();
//   const { id } = useParams();
//   const [loading, setLoading] = useState(false);
//   const [redirect, setRedirect] = useState(false);
//   const [productCategories, setProductCategories] = useState([
//     "OUVERTURE",
//     "ASSECHEMENT DES MURS",
//     "TOITURE",
//     "ISOLATION",
//     "RADIATEUR",
//     "VENTILATION",
//     "TABLEAUX ELECTRIQUES",
//     "FACADE EXTERIEUR"
//   ]);
//   const [selectedCategory, setSelectedCategory] = useState("");

//   const [formData, setFormData] = useState({
//     category: "",
//     reference: "",
//     title: "",
//     description: "",
//     coutAchat: "",
//     fraisGestion: "",
//     total: 0,
//     TVA: "",
//     prixVente: "",
//   });

//   useEffect(() => {
//     if (id) {
//       axios.get(`/produit/${id}`)
//         .then((response) => {
//           const { data } = response;
//           setFormData(data);
//           setSelectedCategory(data.category);
//           form.setFieldsValue(data);
//         })
//         .catch((error) => {
//           console.error("Error fetching product:", error);
//           message.error("Failed to fetch product");
//         });
//     } else {
//       form.resetFields();
//       setFormData({
//         category: "",
//         reference: "",
//         title: "",
//         description: "",
//         prixVente: "",
//       });
//     }
//   }, [id, form]);

//   const handleCategoryChange = (value) => {
//     setSelectedCategory(value);
//     setFormData(prev => ({ ...prev, category: value }));
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async () => {
//     setLoading(true);
//     const token = localStorage.getItem("token");
//     const decodedToken = jwtDecode(token);
//     const userId = decodedToken.userId;

//     try {
//       const payload = {
//         ...formData,
//         userId,
//         total: parseFloat(formData.total) || 0,
//         prixVente: parseFloat(formData.prixVente) || 0,
//       };

//       if (id) {
//         await axios.put(`/produit/${id}`, payload, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         message.success("Produit mis à jour avec succès !");
//       } else {
//         await axios.post("/produit", payload, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         message.success("Produit créé avec succès !");
//       }
//       setRedirect(true);
//     } catch (error) {
//       message.error("Erreur lors de l'enregistrement");
//       console.error("Error:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (redirect) {
//     return <Navigate to="/produits" />;
//   }

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">Produits</h1>

//       <Form
//         form={form}
//         onFinish={handleSubmit}
//         layout="vertical"
//         className="space-y-4 p-4 bg-white rounded-lg shadow-md"
//       >
//         <p className="text-lg font-semibold mb-4">Ajouter produit</p>

//         <Form.Item
//           label="Catégorie"
//           name="category"
//           rules={[{ required: true, message: "Veuillez sélectionner une catégorie!" }]}
//         >
//           <Select
//             placeholder="Sélectionnez une catégorie"
//             onChange={handleCategoryChange}
//           >
//             {productCategories.map((category, index) => (
//               <Select.Option key={index} value={category}>
//                 {category}
//               </Select.Option>
//             ))}
//           </Select>
//         </Form.Item>

//         <Form.Item
//           label="Référence"
//           name="reference"
//           rules={[{ required: true, message: "Veuillez entrer la référence!" }]}
//         >
//           <Input
//             name="reference"
//             value={formData.reference}
//             onChange={handleInputChange}
//             placeholder="Ex: REF-1234"
//           />
//         </Form.Item>

//         <Form.Item
//           label="Titre"
//           name="title"
//           rules={[{ required: true, message: "Veuillez entrer le titre!" }]}
//         >
//           <Input
//             name="title"
//             value={formData.title}
//             onChange={handleInputChange}
//             placeholder="Titre du produit"
//           />
//         </Form.Item>

//         <Form.Item
//           label="Description"
//           name="description"
//           rules={[{ required: true, message: "Veuillez entrer la description!" }]}
//         >
//           <Input.TextArea
//             name="description"
//             value={formData.description}
//             onChange={handleInputChange}
//             rows={4}
//             placeholder="Description détaillée du produit"
//           />
//         </Form.Item>
//         <Form.Item
//           label="Prix de vente (€)"
//           name="prixVente"
//           rules={[{ required: true, message: "Veuillez entrer le prix de vente!" }]}
//         >
//           <Input
//             type="number"
//             name="prixVente"
//             value={formData.prixVente}
//             onChange={handleInputChange}
//             placeholder="Prix de vente en euros"
//             suffix="€"
//           />
//         </Form.Item>

//         {/* <Form.Item
//           label="Coût d'achat"
//           name="coutAchat"
//           rules={[
//             { required: false, message: "Veuillez entrer le coût d'achat!" },
//           ]}
//         >
//           <Input
//             type="number"
//             name="coutAchat"
//             value={formData.coutAchat}
//             onChange={handleInputChange}
//           />
//         </Form.Item> */}

//         {/* <Form.Item
//           label="Frais de gestion"
//           name="fraisGestion"
//           rules={[
//             { required: false, message: "Veuillez entrer les frais de gestion!" },
//           ]}
//         >
//           <Input
//             type="number"
//             name="fraisGestion"
//             value={formData.fraisGestion}
//             onChange={handleInputChange}
//           />
//         </Form.Item> */}

//         {/* <Form.Item label="PRIX MINIMAL DE VENTE" name="total">
//           <Input 
//             type="number" 
//             value={formData.total} 
//             // disabled 
//           />
//         </Form.Item> */}

//         <Form.Item>
//           <Button
//             type="primary"
//             htmlType="submit"
//             className="bg-purple-800 text-white w-full"
//             loading={loading}
//           >
//             {id ? "Mettre à jour" : "Créer"}
//           </Button>
//         </Form.Item>
//       </Form>
//     </div>
//   );
// };

// export default CreatePrograms;
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Form, Input, Select, Button, message, Row, Col } from "antd";
import { jwtDecode } from "jwt-decode";
import { Navigate, useParams } from "react-router-dom";

const CreatePrograms = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [productCategories, setProductCategories] = useState([
    "OUVERTURE",
    "ASSECHEMENT DES MURS",
    "TOITURE",
    "ISOLATION",
    "RADIATEUR",
    "VENTILATION",
    "TABLEAUX ELECTRIQUES",
    "FACADE EXTERIEUR",
    "POMPE À CHALEUR DAIKIN",
    "POMPE À CHALEUR HEIWA",
    "BALLON THERMODYNAMIQUE",
    "ACCESSOIRES D’OUVRAGE"
  ]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [formData, setFormData] = useState({
    category: "",
    reference: "",
    title: "",
    description: "",
    prixAchatHT: "",
    TVA: "",
    tauxMarge: "",
    prixVente: "",
  });

  // Fonction pour calculer le prix de vente TTC
  // const calculatePrixVente = (prixAchatHT, TVA, tauxMarge) => {
  //   const prixHT = parseFloat(prixAchatHT) || 0;
  //   const tauxTVA = parseFloat(TVA) || 0;
  //   const marge = parseFloat(tauxMarge) || 0;

  //   if (prixHT > 0 && marge > 0) {
  //     // Prix de vente HT = Prix d'achat HT * (1 + taux de marge/100)
  //     const prixVenteHT = prixHT * (1 + marge / 100);
      
  //     // Prix de vente TTC = Prix de vente HT * (1 + TVA/100)
  //     const prixVenteTTC = prixVenteHT * (1 + tauxTVA / 100);
      
  //     return prixVenteTTC.toFixed(2);
  //   }
  //   return "";
  // };
  const calculatePrixVente = (prixAchatHT, TVAappliquée, tauxMarge) => {
    const prixHT = parseFloat(prixAchatHT) || 0;
    const tauxTVA = parseFloat(TVAappliquée) || 0;
    const marge = parseFloat(tauxMarge) || 0;

    console.log("Input values:", { prixAchatHT, TVAappliquée, tauxMarge });
    console.log("Parsed values:", { prixHT, tauxTVA, marge });

    if (prixHT > 0) {
      // Apply margin first to HT, then apply TVA
      const prixVenteHT = prixHT * (1 + marge / 100);
      const prixVenteTTC = prixVenteHT * (1 + tauxTVA / 100);
      
      console.log("Calculation steps:", {
        prixVenteHT,
        prixVenteTTC
      });
      
      return prixVenteTTC.toFixed(2);
    }
    return "";
};

  // Effet pour recalculer le prix de vente quand les valeurs changent
  useEffect(() => {
    const { prixAchatHT, TVAappliquée, tauxMarge } = formData;
    const nouveauPrixVente = calculatePrixVente(prixAchatHT, TVAappliquée, tauxMarge);
    
    if (nouveauPrixVente) {
      setFormData(prev => ({ 
        ...prev, 
        prixVente: nouveauPrixVente 
      }));
      form.setFieldsValue({ prixVente: nouveauPrixVente });
    }
  }, [formData.prixAchatHT, formData.TVAappliquée, formData.tauxMarge]);

  useEffect(() => {
    if (id) {
      axios.get(`/produit/${id}`)
        .then((response) => {
          const { data } = response;
          setFormData(data);
          setSelectedCategory(data.category);
          form.setFieldsValue(data);
        })
        .catch((error) => {
          console.error("Error fetching product:", error);
          message.error("Failed to fetch product");
        });
    } else {
      form.resetFields();
      setFormData({
        category: "",
        reference: "",
        title: "",
        description: "",
        prixAchatHT: "",
        TVA: "",
        tauxMarge: "",
        prixVente: "",
      });
    }
  }, [id, form]);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.userId;

    try {
      const payload = {
        ...formData,
        userId,
        prixAchatHT: parseFloat(formData.prixAchatHT) || 0,
        TVA: parseFloat(formData.TVA) || 0,
        tauxMarge: parseFloat(formData.tauxMarge) || 0,
        prixVente: parseFloat(formData.prixVente) || 0,
      };

      if (id) {
        await axios.put(`/produit/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success("Produit mis à jour avec succès !");
      } else {
        await axios.post("/produit", payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success("Produit créé avec succès !");
      }
      setRedirect(true);
    } catch (error) {
      message.error("Erreur lors de l'enregistrement");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (redirect) {
    return <Navigate to="/produits" />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Produits</h1>

      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        className="space-y-4 p-4 bg-white rounded-lg shadow-md"
      >
        <p className="text-lg font-semibold mb-4">Ajouter produit</p>

        <Form.Item
          label="Catégorie"
          name="category"
          rules={[{ required: true, message: "Veuillez sélectionner une catégorie!" }]}
        >
          <Select
            placeholder="Sélectionnez une catégorie"
            onChange={handleCategoryChange}
          >
            {productCategories.map((category, index) => (
              <Select.Option key={index} value={category}>
                {category}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Référence"
          name="reference"
          rules={[{ required: true, message: "Veuillez entrer la référence!" }]}
        >
          <Input
            name="reference"
            value={formData.reference}
            onChange={handleInputChange}
            placeholder="Ex: REF-1234"
          />
        </Form.Item>

        <Form.Item
          label="Titre"
          name="title"
          rules={[{ required: true, message: "Veuillez entrer le titre!" }]}
        >
          <Input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Titre du produit"
          />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: "Veuillez entrer la description!" }]}
        >
          <Input.TextArea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Description détaillée du produit"
          />
        </Form.Item>

        {/* Nouveaux champs pour le calcul du prix */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-md font-semibold mb-3">Calcul du prix de vente</p>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Prix d'achat HT (€)"
                name="prixAchatHT"
                rules={[{ required: true, message: "Veuillez entrer le prix d'achat HT!" }]}
              >
                <Input
                  type="number"
                  name="prixAchatHT"
                  value={formData.prixAchatHT}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  suffix="€"
                  step="0.01"
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                label="TVA (%)"
                name="TVAappliquée"
                rules={[{ required: true, message: "Veuillez entrer le taux de TVA!" }]}
              >
                <Input
                  type="number"
                  name="TVAappliquée"
                  value={formData.TVA}
                  onChange={handleInputChange}
                  placeholder="20"
                  suffix="%"
                  step="0.1"
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                label="Taux de marge (%)"
                name="tauxMarge"
                rules={[{ required: true, message: "Veuillez entrer le taux de marge!" }]}
              >
                <Input
                  type="number"
                  name="tauxMarge"
                  value={formData.tauxMarge}
                  onChange={handleInputChange}
                  placeholder="0"
                  suffix="%"
                  step="0.1"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Form.Item
          label="Prix de vente TTC (€)"
          name="prixVente"
          rules={[{ required: true, message: "Veuillez entrer le prix de vente!" }]}
        >
          <Input
            type="number"
            name="prixVente"
            value={formData.prixVente}
            onChange={handleInputChange}
            placeholder="Prix calculé automatiquement"
            suffix="€"
            readOnly
            style={{ backgroundColor: '#f0f0f0' }}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="bg-purple-800 text-white w-full"
            loading={loading}
          >
            {id ? "Mettre à jour" : "Créer"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default CreatePrograms;