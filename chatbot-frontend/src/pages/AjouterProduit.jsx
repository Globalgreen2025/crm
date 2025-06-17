// import React, { useEffect, useState } from "react";
// import { useParams, useLocation, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { jwtDecode } from "jwt-decode";
// import { DollarOutlined } from "@ant-design/icons";

// const AjouterProduit = () => {
//   const { id } = useParams();
//   const location = useLocation();
//   const productId = location.state?.productId;
//   const navigate = useNavigate();

//   const [loading, setLoading] = useState(false);
//   const [productData, setProductData] = useState({
//     code: "",
//     description: "",
//     total: "",
//     coutAchat: "",
//     fraisGestion: "",
//   });
//   const [error, setError] = useState(null);
//   const token = localStorage.getItem("token");
//   const [program, setProgram] = useState([]);
//   const calculateTotal = (basePrice, quantity) => {
//     return basePrice * quantity;
//   };

//   // Fetch program data (your 2 products)
//   useEffect(() => {
//     const fetchBanners = async () => {
//       try {
//         const response = await axios.get("/program");
//         console.log("Fetched program data:", response.data);
//         setProgram(response.data);
//       } catch (error) {
//         console.error("Failed to fetch programmes:", error);
//       }
//     };
//     fetchBanners();
//   }, []);

//   // Fetch product data if editing
//   useEffect(() => {
//     if (productId) {
//       const fetchProductData = async () => {
//         try {
//           setLoading(true);
//           const response = await axios.get(`/produit/${productId}`);
//           setProductData(response.data);
//         } catch (error) {
//           console.error("Error fetching product data:", error);
//           setError("Failed to fetch product data.");
//         } finally {
//           setLoading(false);
//         }
//       };
//       fetchProductData();
//     }
//   }, [productId]);

//   // Pre-fill form with program data if not editing
//   useEffect(() => {
//     if (!productId && program.length > 0) {
//       const selectedProgram = program[0]; // Default to first program
//       setProductData({
//         quantite: 1,
//         code: selectedProgram.title || "",
//         description: selectedProgram.mainText || "",
//         total: "",
//         coutAchat: "",
//         fraisGestion: "",
//         surface: selectedProgram.surface || "",
//         taillePrixLabel: selectedProgram.taillePrixLabel || "",
//       });
//     }
//   }, [program, productId]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const token = localStorage.getItem("token");
//     const decodedToken = token ? jwtDecode(token) : null;

//     const userId = decodedToken?.userId || decodedToken?.commercialId;

//     try {
//       setLoading(true);
//       setError(null);

//       if (productId) {
//         // Update existing product
//         await axios.put(`/produit/${productId}`, {
//           ...productData,
//           leadId: id,
//           session: userId,
//         });
//       } else {
//         // Create new product in produit collection
//         const res = await axios.post("/produit", {
//           ...productData,
//           leadId: id,
//           session: userId,
//         });
//         console.log("Product created:", res.data);
//       }
//       navigate(`/lead/${id}`);
//     } catch (error) {
//       console.error("Error saving product:", error);
//       if (error.response && error.response.status === 409) {
//         alert("Ce produit est déjà ajouté pour ce lead !");
//       } else {
//         setError("Failed to save product. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setProductData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSurfaceQuantityChange = (e) => {
//     const quantity = parseInt(e.target.value);
//     const newProductData = {
//       ...productData,
//       surfaceQuantity: quantity,
//     };

//     // Recalculate total if surface exists
//     if (productData.surface) {
//       const basePrice = program.find(p => p.title === productData.code)?.total || productData.total;
//       newProductData.total = calculateTotal(basePrice, quantity);
//     }

//     setProductData(newProductData);
//   };

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
//         {productId ? "Modifier Produit" : "Ajouter un Produit"}
//       </h2>

//       {error && (
//         <div className="text-red-500 mb-4 text-center font-medium">{error}</div>
//       )}

//       {/* Display program products as templates */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
//         {program.map((item, index) => (
//           <div
//             key={index}
//             className="bg-white border border-gray-200 rounded-lg shadow-md p-6"
//           >
//             <div className="mb-6">
//               <img
//                 src={item.imageUrl}
//                 alt={`Program ${index}`}
//                 className="w-full h-60 object-cover rounded-md"
//               />
//             </div>
//             <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
//             <p className="text-gray-600 mt-2">{item.mainText}</p>
//             <p className="program-price flex items-center">
//               <DollarOutlined className="mr-2" /> {/* Dollar icon */}
//               <span className="font-bold">{item.total}€</span>{" "}
//               {/* Display total price in bold */}
//             </p>
//             <button
//               onClick={() =>
//                 setProductData({
//                   code: item.title,
//                   description: item.mainText,
//                   coutAchat: item.coutAchat,
//                   fraisGestion: item.fraisGestion,
//                   total: item.total,
//                   surface: item.surface,
//                   taillePrixLabel: item.taillePrixLabel,
//                 })
//               }
//               className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
//             >
//               Utiliser ce modèle
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* Add/Edit product form */}
//       <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 max-w-2xl mx-auto">
//         <form onSubmit={handleSubmit}>
//           <div className="mb-4">
//             <label
//               htmlFor="code"
//               className="block text-sm font-semibold text-gray-700 mb-1"
//             >
//               Titre
//             </label>
//             <input
//               type="text"
//               id="code"
//               name="code"
//               value={productData.titre}
//               onChange={handleChange}
//               className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
//               required
//             />
//           </div>

//           <div className="mb-4 mt-4">
//             <label
//               htmlFor="description"
//               className="block text-sm font-semibold text-gray-700 mb-1"
//             >
//               Description
//             </label>
//             <textarea
//               id="description"
//               name="description"
//               rows="4"
//               value={productData.description}
//               onChange={handleChange}
//               className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
//               required
//             />
//           </div>
//      {productData.surface && (
//             <div className="mb-4">
//             <label
//               htmlFor="surfaceQuantity"
//               className="block text-sm font-semibold text-gray-700 mb-1"
//             >
//               Quantité de surface ({productData.surface})
//             </label>
//             <input
//               type="number"
//               id="surfaceQuantity"
//               name="surfaceQuantity"
//               // min="1"
//               value={productData.surfaceQuantity}
//               onChange={handleSurfaceQuantityChange}
//               className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//         )}
//           <div className="mt-4">
//             <label
//               htmlFor="surface"
//               className="block text-sm font-medium text-gray-700"
//             >
//               Surface
//             </label>
//             <input
//               // disabled
//               type="text"
//               id="surface"
//               name="surface"
//               value={productData.surface || ""}
//               onChange={handleChange}
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//             />
//           </div>
//           <div className="mt-4">
//             <label
//               htmlFor="taillePrixLabel"
//               className="block text-sm font-medium text-gray-700"
//             >
//               Prix par Taille
//             </label>
//             <input
//               // disabled
//               type="text"
//               id="taillePrixLabel"
//               name="taillePrixLabel"
//               value={productData.taillePrixLabel || ""}
//               onChange={handleChange}
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//             />
//           </div>
//           <div className="mb-6 mt-4">
//             <label
//               htmlFor="total"
//               className="block text-sm font-semibold text-gray-700 mb-1"
//             >
//               PRIX MINIMAL DE VENTE
//             </label>
//             <input
//               disabled
//               type="number"
//               id="total"
//               name="total"
//               value={productData.total}
//               onChange={handleChange}
//               className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
//               required
//             />
//           </div>

//           <div className="text-center">
//             <button
//               type="submit"
//               disabled={loading}
//               className={`inline-block w-full py-3 text-white font-medium rounded-md transition ${
//                 loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
//               }`}
//             >
//               {loading
//                 ? "Enregistrement..."
//                 : productId
//                 ? "Modifier"
//                 : "Ajouter"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AjouterProduit;

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Table, Button, Input, Space, message, Form, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { jwtDecode } from "jwt-decode";

const AjouterProduit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form] = Form.useForm();

  // Form state for the selected product
  const [productForm, setProductForm] = useState({
    prixVente: '',
    forfait: '',
    category: '',
    title: '',
    description: '',
  });

  // Fetch products data
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/produit");
        setProducts(response.data);
      } catch (error) {
        message.error("Failed to fetch products.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [id]);

  const columns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: "Titre",
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <div style={{ whiteSpace: 'pre-line' }}>{text}</div>,
    },
    {
      title: 'Prix de vente',
      dataIndex: 'prixVente',
      key: 'prixVente',
      render: (text) => text ? `${text}€` : '-',
      align: 'right',
    },
    {
      title: 'Forfait',
      dataIndex: 'forfait',
      key: 'forfait',
      render: (text) => text ? `${text}€` : '-',
      align: 'right',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            onClick={() => handleSelectProduct(record)}
          >
            Sélectionner
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleAddToClient(record)}
            disabled={!selectedProduct || selectedProduct._id !== record._id}
          >
            Ajouter au client
          </Button>
        </Space>
      ),
    },
  ];

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setProductForm({
      ...product,
      prixVente: product.prixVente || '',
      forfait: product.forfait || ''
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddToClient = async (product) => {
    if (!productForm.prixVente) {
      message.warning('Le prix de vente est obligatoire');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const decodedToken = token ? jwtDecode(token) : null;
      const userId = decodedToken?.userId || decodedToken?.commercialId;

      // Update the product with new values
      const updatedProduct = {
        ...product,
        leadId: id,
        session: userId,
        prixVente: productForm.prixVente,
        forfait: productForm.forfait || null
      };
      console.log('updatedProduct', updatedProduct);

      await axios.put(`/produit/${product._id}`, updatedProduct);
      

      message.success('Produit ajouté au client avec succès');
      navigate(`/lead/${id}`);
    } catch (error) {
      console.error("Error adding product to client:", error);
      if (error.response && error.response.status === 409) {
        message.error("Ce produit est déjà associé à ce client");
      } else {
        message.error("Erreur lors de l'ajout du produit");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProduct) {
      message.warning('Veuillez sélectionner un produit');
      return;
    }

    try {
      setLoading(true);
      const updatedProduct = {
        ...selectedProduct,
        ...productForm
      };

      await axios.put(`/produit/${selectedProduct._id}`, updatedProduct);
      
      setProducts(products.map(p => 
        p._id === selectedProduct._id ? updatedProduct : p
      ));
      
      message.success('Produit mis à jour avec succès');
      setSelectedProduct(null);
      setProductForm({ prixVente: '', forfait: '' });
    } catch (error) {
      message.error('Échec de la mise à jour du produit');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Produits</h1>
      </div>

      <Table
        bordered
        dataSource={products}
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
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
      />

      {selectedProduct && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Produit sélectionné: {selectedProduct.title}
          </h3>
          
          <Form layout="vertical">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <Form.Item label="Prix de vente (€)" required>
                <Input
                  type="number"
                  name="prixVente"
                  value={productForm.prixVente}
                  onChange={handleFormChange}
                  placeholder="Entrez le prix de vente"
                  className="w-full"
                />
              </Form.Item>
              
              <Form.Item label="Forfait (€)">
                <Input
                  type="number"
                  name="forfait"
                  value={productForm.forfait}
                  onChange={handleFormChange}
                  placeholder="Entrez le forfait"
                  className="w-full"
                />
              </Form.Item>
              
              <div className="flex items-end">
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  className="bg-green-600 text-white h-10"
                >
                  Mettre à jour
                </Button>
                <Button
                  onClick={() => setSelectedProduct(null)}
                  className="ml-2 h-10"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
};

export default AjouterProduit;