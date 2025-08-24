// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
// import { Button, message, Upload, Form, Input, Avatar, Select } from "antd";
// import { jwtDecode } from "jwt-decode";
// import { Navigate, useParams } from "react-router-dom";

// const CreatePrograms = () => {
//   const [formData, setFormData] = useState({
//     title: "",
//     mainText: "",
//     // imageUrl: "",
//     coutAchat: "",
//     fraisGestion: "",
//     total: 0,
//     surface: "",
//     taillePrixLabel: "",
//   });
//   const [uploadedFileName, setUploadedFileName] = useState("");
//   // const [imageUrl, setImageUrl] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [fileList, setFileList] = useState([]);
//   const [redirect, setRedirect] = useState(false);
//   const [form] = Form.useForm();
//   const { id } = useParams();
//   const [prixOptions, setPrixOptions] = useState([]);
//   const [surfaceSelected, setSurfaceSelected] = useState("");
//   const [manualInputMode, setManualInputMode] = useState(false);

//   // Called when user types in coutAchat or fraisGestion manually
//   const handleManualChange = (field, value) => {
//     setManualInputMode(true);
//     setFormData((prev) => ({ ...prev, [field]: value }));
//     form.setFieldsValue({ [field]: value });

//     // Optionally, clear surface-related data
//     if (field === "coutAchat" || field === "fraisGestion") {
//       setFormData((prev) => ({
//         ...prev,
//         surface: "",
//         taillePrixLabel: "",
//       }));
//       form.setFieldsValue({
//         surface: undefined,
//         taillePrixLabel: undefined,
//       });
//     }
//   };

//   useEffect(() => {
//     if (id) {
//       const res = axios
//         .get(`/program/${id}`)
//         .then((response) => {
//           const { data } = response;
//           setFormData(data);
//           // setImageUrl(data.imageUrl);
//           // console.log("image url:", data.imageUrl);
//           form.setFieldsValue(data);
//         })
//         .catch((error) => {
//           console.error("Error fetching programme:", error);
//           message.error("Failed to fetch programme");
//         });
//       console.log("Responsedata:", res.data);
//     } else {
//       form.resetFields();
//       setFormData({
//         title: "",
//         mainText: "",
//         surface: "",
//         taillePrixLabel: "",
//         coutAchat: "",
//         fraisGestion: "",
//         total: "",
//       });
//       // setImageUrl("");
//     }
//   }, [id, form]);

//   const handleSurfaceChange = (value, isInitialLoad = false) => {
//     setSurfaceSelected(value);
//     setFormData((prev) => ({ ...prev, surface: value }));

//     if (value === "G") {
//       setPrixOptions([
//         { label: "100 mm - 140€", value: "140" },
//         { label: "150 mm - 145€", value: "145" },
//         { label: "200 mm - 150€", value: "150" },
//       ]);
//     } else if (value === "HG") {
//       setPrixOptions([
//         { label: "100 mm - 175€", value: "175" },
//         { label: "150 mm - 177€", value: "177" },
//         { label: "200 mm - 179€", value: "179" },
//       ]);
//     }

//     // If loading existing data, select the appropriate prix option
//     if (isInitialLoad && formData.taillePrixLabel) {
//       const selectedOption = prixOptions.find(
//         (opt) => opt.label === formData.taillePrixLabel
//       );
//       if (selectedOption) {
//         form.setFieldsValue({
//           total: selectedOption.value,
//           taillePrixLabel: selectedOption.label,
//         });
//       }
//     }
//   };

//   const handleTaillePrixChange = (value, option) => {
//     setFormData((prev) => ({
//       ...prev,
//       taillePrixLabel: option.label,
//       total: value,
//       coutAchat: "",
//       fraisGestion: "",
//     }));

//     form.setFieldsValue({
//       total: value,
//       taillePrixLabel: option.label,
//       coutAchat: "",
//       fraisGestion: "",
//     });
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;

//     setFormData((prev) => {
//       const updated = { ...prev, [name]: value };

//       // Only calculate total if we're changing coutAchat or fraisGestion
//       if (name === "coutAchat" || name === "fraisGestion") {
//         const cout = parseFloat(updated.coutAchat) || 0;
//         const frais = parseFloat(updated.fraisGestion) || 0;
//         const total = (cout + frais).toFixed(2);

//         updated.total = total;
//         updated.taillePrixLabel = "";
//         form.setFieldsValue({ total, taillePrixLabel: "" });
//       }

//       return updated;
//     });
//   };

//   const handleSubmit = async () => {
//     setLoading(true);
//     const token = localStorage.getItem("token");
//     const decodedToken = jwtDecode(token);
//     const userId = decodedToken.userId;

//     const formDataWithUser = {
//       ...formData,
//       userId,
//       // imageUrl,
//       coutAchat: parseFloat(formData.coutAchat) || 0,
//       fraisGestion: parseFloat(formData.fraisGestion) || 0,
//       total: parseFloat(formData.total),
//       taillePrixLabel: formData.taillePrixLabel || "",
//       surface: formData.surface || "",
//     };
//     console.log("Submitting formData:", formDataWithUser);

//     try {
//       if (id) {
//         setRedirect(false);
//         const res = await axios.put(`/program/${id}`, formDataWithUser, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         console.log("Response data:", res.data);
//         message.success("Produit mis à jour avec succès !");
//         setRedirect(true);
//       } else {
//         setRedirect(false);
//         await axios.post("/program", formDataWithUser, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         message.success("Programme créé avec succès !");
//         setRedirect(true);
//       }

//       setFormData({
//         title: "",
//         mainText: "",
//       });
//       // setImageUrl("");
//       setUploadedFileName("");
//       setFileList([]);
//       form.resetFields();
//     } catch (error) {
//       message.error("Failed to create banner.");
//       console.error("Error creating banner:", error);
//     } finally {
//       setLoading(false);
//     }
//   };
//   if (redirect) {
//     return <Navigate to={"/produits"} />;
//   }
//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">Produits</h1>

//       <Form
//         className="space-y-4 p-4 bg-white rounded-lg shadow-md"
//         onFinish={handleSubmit}
//         form={form}
//         layout="vertical"
//       >
//         <p className="text-lg font-semibold mb-4">Ajouter produit</p>

//         {/* <Form.Item label="Image" name="imageUrl">
//           <Upload {...uploadProps}>
//             <Button icon={<UploadOutlined />} loading={uploading}>
//               Télécharger
//             </Button>
//           </Upload>
//         </Form.Item> */}

//         {/* {(uploadedFileName || imageUrl) && (
//           <Form.Item>
//             <div className="flex flex-col items-start mt-2">
//               <Avatar
//                 src={imageUrl}
//                 alt="Uploaded Image"
//                 className="w-48 h-48 mb-4 border border-gray-300 rounded-md object-cover"
//               />

//               <Button
//                 type="link"
//                 icon={<DeleteOutlined />}
//                 onClick={() => {
//                   form.setFieldsValue({ imageUrl: "" });
//                   setImageUrl("");
//                   setUploadedFileName("");
//                   setFileList([]);
//                 }}
//               />
//             </div>
//           </Form.Item>
//         )} */}

//         <Form.Item
//           label="Titre de produit"
//           name="title"
//           rules={[{ required: true, message: "Please input the title!" }]}
//         >
//           <Input
//             value={formData.title}
//             onChange={handleInputChange}
//             name="title"
//           />
//         </Form.Item>

//         <Form.Item
//           label="DESCRIPTIF"
//           name="mainText"
//           rules={[{ required: true, message: "Please input the main text!" }]}
//         >
//           <Input.TextArea
//             value={formData.mainText}
//             onChange={handleInputChange}
//             name="mainText"
//             rows={4}
//           />
//         </Form.Item>

//         <Form.Item
//           label="SURFACE"
//           name="surface"
//           rules={[
//             { required: false, message: "Veuillez sélectionner une surface!" },
//           ]}
//         >
//           <Select
//             placeholder="Sélectionnez un type"
//             onChange={handleSurfaceChange}
//           >
//             <Select.Option value="G">
//               G (GROUPEMENT) Hauteur max 3000
//             </Select.Option>
//             <Select.Option value="HG">
//               HG (HORS GROUPEMENT) Hauteur supérieure à 3000
//             </Select.Option>
//           </Select>
//         </Form.Item>

//         {prixOptions.length > 0 && (
//           <Form.Item
//             label="Options de prix"
//             name="taillePrixLabel"
//             rules={[
//               { required: false, message: "Veuillez sélectionner une option!" },
//             ]}
//           >
//             <Select
//               placeholder="Choisissez une option"
//               onChange={handleTaillePrixChange}
//             >
//               {prixOptions.map((option, index) => (
//                 <Select.Option key={index} value={option.value} label={option.label}>
//                   {option.label}
//                 </Select.Option>
//               ))}
//             </Select>
//           </Form.Item>
//         )}

//         {formData.taillePrixLabel && (
//           <Form.Item label="Taille sélectionnée">
//             <Input value={formData.taillePrixLabel} disabled />
//           </Form.Item>
//         )}

//         <Form.Item
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
//         </Form.Item>

//         <Form.Item
//           label="Frais de gestion"
//           name="fraisGestion"
//           rules={[
//             {
//               required: false,
//               message: "Veuillez entrer les frais de gestion!",
//             },
//           ]}
//         >
//           <Input
//             type="number"
//             name="fraisGestion"
//             value={formData.fraisGestion}
//             onChange={handleInputChange}
//           />
//         </Form.Item>

//         <Form.Item label="PRIX MINIMAL DE VENTE" name="total">
//           <Input type="number" name="total" value={formData.total} disabled />
//         </Form.Item>

//         <Form.Item>
//           <Button
//             type="primary"
//             htmlType="submit"
//             className="bg-purple-800 text-white w-full"
//             loading={loading}
//           >
//             {loading ? "Submitting..." : "Submit"}
//           </Button>
//         </Form.Item>
//       </Form>
//     </div>
//   );
// };

// export default CreatePrograms;

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Form, Input, Select, Button, message } from "antd";
import { jwtDecode } from "jwt-decode";
import { Navigate, useParams } from "react-router-dom";

const CreatePrograms = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [productCategories, setProductCategories] = useState([
    "OUVERTURE",
    "Assechement des murs",
    "TOITURE",
    "ISOLATION",
    "RADIATEUR",
    "VENTILATION",
    "TABLEAUX ELECTRIQUES",
    "FACADE EXTERIEUR"
  ]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [formData, setFormData] = useState({
    category: "",
    reference: "",
    title: "",
    description: "",
    coutAchat: "",
    fraisGestion: "",
    total: 0,
    surface: "",
    taillePrixLabel: "",
    prixVente: "",
  });

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
        // coutAchat: parseFloat(formData.coutAchat) || 0,
        // fraisGestion: parseFloat(formData.fraisGestion) || 0,
        total: parseFloat(formData.total) || 0,
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
        <Form.Item
          label="Prix de vente (€)"
          name="prixVente"
          rules={[{ required: true, message: "Veuillez entrer le prix de vente!" }]}
        >
          <Input
            type="number"
            name="prixVente"
            value={formData.prixVente}
            onChange={handleInputChange}
            placeholder="Prix de vente en euros"
            suffix="€"
          />
        </Form.Item>

        {/* <Form.Item
          label="Coût d'achat"
          name="coutAchat"
          rules={[
            { required: false, message: "Veuillez entrer le coût d'achat!" },
          ]}
        >
          <Input
            type="number"
            name="coutAchat"
            value={formData.coutAchat}
            onChange={handleInputChange}
          />
        </Form.Item> */}

        {/* <Form.Item
          label="Frais de gestion"
          name="fraisGestion"
          rules={[
            { required: false, message: "Veuillez entrer les frais de gestion!" },
          ]}
        >
          <Input
            type="number"
            name="fraisGestion"
            value={formData.fraisGestion}
            onChange={handleInputChange}
          />
        </Form.Item> */}

        {/* <Form.Item label="PRIX MINIMAL DE VENTE" name="total">
          <Input 
            type="number" 
            value={formData.total} 
            // disabled 
          />
        </Form.Item> */}

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