// import React, { useEffect, useState } from "react";
// import {
//   Table,
//   Button,
//   Space,
//   Tooltip,
//   message,
//   Card,
//   Row,
//   Col,
//   Select,
//   Tag,
//   Input,
// } from "antd";
// import {
//   InfoCircleOutlined,
//   ShoppingCartOutlined,
//   CloseOutlined,
// } from "@ant-design/icons";
// import { useParams } from "react-router-dom";
// import axios from "axios";
// import { jwtDecode } from "jwt-decode";
// import logo from "../assets/logo.jpeg";

// const Produits = ({ onCartChange }) => {
//   const { id } = useParams();
//   const [produits, setProduits] = useState([]);
//   const token = localStorage.getItem("token");
//   const [editableProducts, setEditableProducts] = useState({});
//   const [filteredProduits, setFilteredProduits] = useState([]);
//   const [searchText, setSearchText] = useState("");
//   const [searchReference, setSearchReference] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [categories, setCategories] = useState([]);
//   const [previewImage, setPreviewImage] = useState({
//     visible: false,
//     url: "",
//   });

//   useEffect(() => {
//     const fetchProduits = async () => {
//       try {
//         const response = await axios.get("/produit", {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         const allProduits = response.data;
//         setProduits(allProduits);
//         setFilteredProduits(allProduits);

//         // Extract unique categories
//         const uniqueCategories = [
//           ...new Set(allProduits.map((p) => p.category)),
//         ];
//         setCategories(uniqueCategories);
//       } catch (error) {
//         console.error("Error fetching produits:", error);
//       }
//     };

//     fetchProduits();
//   }, [id]);

//   useEffect(() => {
//     // Filter products based on search criteria
//     let results = produits;

//     if (searchText) {
//       results = results.filter((item) =>
//         item.title.toLowerCase().includes(searchText.toLowerCase())
//       );
//     }

//     if (searchReference) {
//       results = results.filter((item) =>
//         item.reference.toLowerCase().includes(searchReference.toLowerCase())
//       );
//     }

//     if (selectedCategory) {
//       results = results.filter((item) => item.category === selectedCategory);
//     }

//     setFilteredProduits(results);
//   }, [searchText, searchReference, selectedCategory, produits]);

//   useEffect(() => {
//     const fetchProduits = async () => {
//       const token = localStorage.getItem("token");
//       try {
//         const response = await axios.get("/produit", {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         const allProduits = response.data;
//         console.log("Fetched produits:", allProduits);

//         setProduits(allProduits);
//       } catch (error) {
//         console.error("Error fetching produits:", error);
//       }
//     };

//     fetchProduits();
//   }, [id]);

//   const handlePrixVenteChange = (value, productId) => {
//     setEditableProducts((prev) => ({
//       ...prev,
//       [productId]: {
//         ...prev[productId],
//         prixVente: value,
//       },
//     }));
//   };

//   const handleForfaitChange = (value, productId) => {
//     setEditableProducts((prev) => ({
//       ...prev,
//       [productId]: {
//         ...prev[productId],
//         forfait: value,
//       },
//     }));
//   };

//   const handleAddToCart = async (product) => {
//     try {
//       const token = localStorage.getItem("token");
//       const decodedToken = token ? jwtDecode(token) : null;

//       // Determine user type and ID
//       const isAdmin = decodedToken?.userId;
//       const isCommercial = decodedToken?.commercialId;

//       if (!isAdmin && !isCommercial) {
//         throw new Error("User not authenticated");
//       }

//       const userType = isAdmin ? "admin" : "commercial";
//       const userId = isAdmin || isCommercial;

//       if (!product || !product._id) {
//         throw new Error("Product is invalid");
//       }

//       const prixVente = editableProducts[product._id]?.prixVente;
//       const forfait = editableProducts[product._id]?.forfait || 0;

//       // Check for existing item in both backend and local storage
//       const backendResponse = await axios.get(`/panier/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       console.log("Backend cart data:", backendResponse.data);

//       const currentCart = JSON.parse(localStorage.getItem("panierItems")) || [];

//       // Check for duplicates considering user type
//       const isAlreadyInCart =
//         backendResponse.data.some(
//           (item) =>
//             item.produit?._id === product._id && item.userId.equals(userId) // Using equals for ObjectId comparison
//         ) ||
//         currentCart.some(
//           (item) =>
//             item.produit?._id === product._id &&
//             item.userId === userId.toString()
//         );

//       if (isAlreadyInCart) {
//         message.warning("Produit déjà existant dans le panier");
//         return;
//       }

//       // Add to backend
//       const response = await axios.post("/panier", {
//         produitId: product._id,
//         quantite: 1,
//         leadId: id,
//         total: parseFloat(prixVente),
//         forfait: parseFloat(forfait) || undefined,
//         userId: userId,
//         userType: userType,
//         userTypeRef: isAdmin ? "Admin" : "Commercial",
//       });

//       // Update local storage and UI
//       const updatedCart = [...currentCart, response.data];
//       localStorage.setItem("panierItems", JSON.stringify(updatedCart));

//       const newQuantity = updatedCart.reduce(
//         (sum, item) => sum + (item.quantite || 0),
//         0
//       );
//       localStorage.setItem("cartQuantity", newQuantity.toString());

//       if (onCartChange) onCartChange(newQuantity);
//       window.dispatchEvent(new Event("storage"));
//       message.success("Produit ajouté au panier");
//     } catch (error) {
//       console.error("Error adding to panier:", error);
//       message.error("Échec de l'ajout au panier");
//     }
//   };

//   const columns = [
//     {
//       title: "Référence",
//       dataIndex: "reference",
//       key: "reference",
//     },
//     {
//       title: "Category",
//       dataIndex: "category",
//       key: "category",
//       render: (category) => <Tag color="blue">{category}</Tag>,
//     },
//     {
//       title: "Titre",
//       dataIndex: "title",
//       key: "title",
//     },
//     {
//       title: "Description",
//       dataIndex: "description",
//       key: "description",
//       render: (text) => <div style={{ whiteSpace: "pre-line" }}>{text}</div>,
//     },
//     {
//       title: "Prix de vente",
//       dataIndex: "prixVente",
//       key: "prixVente",
//       render: (text, record) => (
//         <Input
//           type="number"
//           defaultValue={text}
//           onChange={(e) => handlePrixVenteChange(e.target.value, record._id)}
//           style={{ width: 100 }}
//         />
//       ),
//       align: "right",
//     },
//     {
//       title: "Forfait",
//       dataIndex: "forfait",
//       key: "forfait",
//       render: (text, record) => (
//         <div className="flex items-center gap-2">
//           <Input
//             type="number"
//             defaultValue={text || ""}
//             onChange={(e) => handleForfaitChange(e.target.value, record._id)}
//             style={{ width: 100 }}
//           />
//           <Button
//             type="text"
//             icon={<InfoCircleOutlined />}
//             onClick={() =>
//               setPreviewImage({
//                 visible: true,
//                 imgSrc: logo, // Using your imported logo
//               })
//             }
//           />
//         </div>
//       ),
//       align: "right",
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: (_, record) => (
//         <Space size="middle">
//           <Tooltip title="Ajouter au panier">
//             <ShoppingCartOutlined
//               style={{ color: "green", cursor: "pointer", size: "40px" }}
//               onClick={() => handleAddToCart(record)}
//             />
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];
//   // return (
//   //   <div style={{ padding: "20px" }}>
//   //     <Table
//   //       columns={[
//   //         ...columns.map((col) => ({
//   //           ...col,
//   //           title: (
//   //             <div className="flex flex-col items-center">
//   //               <div className="text-xs">{col.title}</div>
//   //             </div>
//   //           ),
//   //         })),
//   //       ]}
//   //       dataSource={produits} // Pass fetched products to the table
//   //       pagination={false}
//   //       rowKey="_id" // Use a unique key for each row (make sure _id is present in the fetched data)
//   //     />
//   //   </div>
//   // );
//   return (
//     <div style={{ padding: "20px" }}>
//       {/* Search and Filter Section */}
//       <Card title="Recherche de Produits" style={{ marginBottom: 20 }}>
//         <Row gutter={16}>
//           <Col span={8}>
//             <Input
//               placeholder="Rechercher par titre"
//               allowClear
//               onChange={(e) => setSearchText(e.target.value)}
//               style={{ width: "100%" }}
//             />
//           </Col>
//           <Col span={8}>
//             <Input
//               placeholder="Rechercher par référence"
//               allowClear
//               onChange={(e) => setSearchReference(e.target.value)}
//               style={{ width: "100%" }}
//             />
//           </Col>
//           <Col span={8}>
//             <Select
//               placeholder="Filtrer par catégorie"
//               allowClear
//               style={{ width: "100%" }}
//               onChange={(value) => setSelectedCategory(value)}
//               options={categories.map((cat) => ({
//                 value: cat,
//                 label: cat,
//               }))}
//             />
//           </Col>
//         </Row>
//         <Row style={{ marginTop: 10 }}>
//           <Col>
//             <Button
//               type="link"
//               onClick={() => {
//                 setSearchText("");
//                 setSearchReference("");
//                 setSelectedCategory(null);
//               }}
//             >
//               Réinitialiser les filtres
//             </Button>
//           </Col>
//         </Row>
//       </Card>

//       {previewImage.visible && (
//         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
//           <div className="relative max-w-full max-h-full">
//             <img
//               src={previewImage.imgSrc}
//               alt="Forfait details"
//               className="max-h-[90vh] max-w-full object-contain"
//             />
//             <Button
//               type="text"
//               icon={<CloseOutlined />}
//               onClick={() =>
//                 setPreviewImage({ ...previewImage, visible: false })
//               }
//               className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
//             />
//           </div>
//         </div>
//       )}

//       {/* Products Table */}
//       <Table
//         columns={columns.map((col) => ({
//           ...col,
//           title: (
//             <div className="flex flex-col items-center">
//               <div className="text-xs">{col.title}</div>
//             </div>
//           ),
//         }))}
//         dataSource={filteredProduits}
//         pagination={{ pageSize: 10 }}
//         rowKey="_id"
//         scroll={{ x: true }}
//       />
//     </div>
//   );
// };

// export default Produits;

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Tooltip,
  message,
  Card,
  Row,
  Col,
  Select,
  Tag,
  Input,
} from "antd";
import {
  InfoCircleOutlined,
  ShoppingCartOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
// import logo from "../assets/logo.jpeg";

const Produits = ({ onCartChange }) => {
  const { id } = useParams();
  const [produits, setProduits] = useState([]);
  const token = localStorage.getItem("token");
  const [editableProducts, setEditableProducts] = useState({});
  const [filteredProduits, setFilteredProduits] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchReference, setSearchReference] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [previewImage, setPreviewImage] = useState({
    visible: false,
    url: "",
  });

  // Function to calculate forfait based on prixVente
  const calculateForfait = (prixVente) => {
    const price = parseFloat(prixVente);
    
    if (isNaN(price) || price < 1000) return 0;
    
    // Calculate the base forfait
    const base = Math.floor((price - 1000) / 500);
    const forfait = 280 + (base * 40);
    
    return forfait;
  };

  useEffect(() => {
    const fetchProduits = async () => {
      try {
        const response = await axios.get("/produit", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const allProduits = response.data;
        setProduits(allProduits);
        setFilteredProduits(allProduits);

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(allProduits.map((p) => p.category)),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching produits:", error);
      }
    };

    fetchProduits();
  }, [id]);

  useEffect(() => {
    // Filter products based on search criteria
    let results = produits;

    if (searchText) {
      results = results.filter((item) =>
        item.title.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (searchReference) {
      results = results.filter((item) =>
        item.reference.toLowerCase().includes(searchReference.toLowerCase())
      );
    }

    if (selectedCategory) {
      results = results.filter((item) => item.category === selectedCategory);
    }

    setFilteredProduits(results);
  }, [searchText, searchReference, selectedCategory, produits]);

  useEffect(() => {
    const fetchProduits = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("/produit", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const allProduits = response.data;
        console.log("Fetched produits:", allProduits);

        setProduits(allProduits);
      } catch (error) {
        console.error("Error fetching produits:", error);
      }
    };

    fetchProduits();
  }, [id]);

  const handlePrixVenteChange = (value, productId) => {
    const prixVente = parseFloat(value);
    
    // Calculate forfait based on prixVente
    const forfait = calculateForfait(prixVente);
    
    setEditableProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        prixVente: value,
        forfait: forfait
      },
    }));
  };

  const handleForfaitChange = (value, productId) => {
    setEditableProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        forfait: value,
      },
    }));
  };

  const handleAddToCart = async (product) => {
    try {
      const token = localStorage.getItem("token");
      const decodedToken = token ? jwtDecode(token) : null;

      // Determine user type and ID
      const isAdmin = decodedToken?.userId;
      const isCommercial = decodedToken?.commercialId;

      if (!isAdmin && !isCommercial) {
        throw new Error("User not authenticated");
      }

      const userType = isAdmin ? "admin" : "commercial";
      const userId = isAdmin || isCommercial;

      if (!product || !product._id) {
        throw new Error("Product is invalid");
      }

      const prixVente = editableProducts[product._id]?.prixVente;
      const forfait = editableProducts[product._id]?.forfait || 0;

      // Check for existing item in both backend and local storage
      const backendResponse = await axios.get(`/panier/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Backend cart data:", backendResponse.data);

      const currentCart = JSON.parse(localStorage.getItem("panierItems")) || [];

      // Check for duplicates considering user type
      const isAlreadyInCart =
        backendResponse.data.some(
          (item) =>
            item.produit?._id === product._id && item.userId.equals(userId)
        ) ||
        currentCart.some(
          (item) =>
            item.produit?._id === product._id &&
            item.userId === userId.toString()
        );

      if (isAlreadyInCart) {
        message.warning("Produit déjà existant dans le panier");
        return;
      }

      // Add to backend
      const response = await axios.post("/panier", {
        produitId: product._id,
        quantite: 1,
        leadId: id,
        total: parseFloat(prixVente),
        forfait: parseFloat(forfait) || undefined,
        userId: userId,
        userType: userType,
        userTypeRef: isAdmin ? "Admin" : "Commercial",
      });

      // Update local storage and UI
      const updatedCart = [...currentCart, response.data];
      localStorage.setItem("panierItems", JSON.stringify(updatedCart));

      const newQuantity = updatedCart.reduce(
        (sum, item) => sum + (item.quantite || 0),
        0
      );
      localStorage.setItem("cartQuantity", newQuantity.toString());

      if (onCartChange) onCartChange(newQuantity);
      window.dispatchEvent(new Event("storage"));
      message.success("Produit ajouté au panier");
    } catch (error) {
      console.error("Error adding to panier:", error);
      message.error("Échec de l'ajout au panier");
    }
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
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => <div style={{ whiteSpace: "pre-line" }}>{text}</div>,
    },
    {
      title: "Prix de vente",
      dataIndex: "prixVente",
      key: "prixVente",
      render: (text, record) => (
        <Input
          type="number"
          defaultValue={text}
          onChange={(e) => handlePrixVenteChange(e.target.value, record._id)}
          style={{ width: 100 }}
        />
      ),
      align: "right",
    },
    {
      title: "Forfait",
      dataIndex: "forfait",
      key: "forfait",
      render: (text, record) => {
        const currentForfait = editableProducts[record._id]?.forfait || text || 0;
        
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={currentForfait}
              readOnly
              style={{ width: 100, backgroundColor: '#f5f5f5' }}
            />
            {/* <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() =>
                setPreviewImage({
                  visible: true,
                  imgSrc: logo,
                })
              }
            /> */}
          </div>
        );
      },
      align: "right",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Ajouter au panier">
            <ShoppingCartOutlined
              style={{ color: "green", cursor: "pointer", size: "40px" }}
              onClick={() => handleAddToCart(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      {/* Search and Filter Section */}
      <Card title="Recherche de Produits" style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="Rechercher par titre"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%" }}
            />
          </Col>
          <Col span={8}>
            <Input
              placeholder="Rechercher par référence"
              allowClear
              onChange={(e) => setSearchReference(e.target.value)}
              style={{ width: "100%" }}
            />
          </Col>
          <Col span={8}>
            <Select
              placeholder="Filtrer par catégorie"
              allowClear
              style={{ width: "100%" }}
              onChange={(value) => setSelectedCategory(value)}
              options={categories.map((cat) => ({
                value: cat,
                label: cat,
              }))}
            />
          </Col>
        </Row>
        <Row style={{ marginTop: 10 }}>
          <Col>
            <Button
              type="link"
              onClick={() => {
                setSearchText("");
                setSearchReference("");
                setSelectedCategory(null);
              }}
            >
              Réinitialiser les filtres
            </Button>
          </Col>
        </Row>
      </Card>

      {previewImage.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={previewImage.imgSrc}
              alt="Forfait details"
              className="max-h-[90vh] max-w-full object-contain"
            />
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() =>
                setPreviewImage({ ...previewImage, visible: false })
              }
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
            />
          </div>
        </div>
      )}

      {/* Products Table */}
      <Table
        columns={columns.map((col) => ({
          ...col,
          title: (
            <div className="flex flex-col items-center">
              <div className="text-xs">{col.title}</div>
            </div>
          ),
        }))}
        dataSource={filteredProduits}
        pagination={{ pageSize: 10 }}
        rowKey="_id"
        scroll={{ x: true }}
      />
    </div>
  );
};

export default Produits;