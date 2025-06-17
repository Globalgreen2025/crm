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
  ShoppingCartOutlined,
} from "@ant-design/icons";
import {  useParams } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

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
        const uniqueCategories = [...new Set(allProduits.map(p => p.category))];
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
      results = results.filter(item =>
        item.title.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    if (searchReference) {
      results = results.filter(item =>
        item.reference.toLowerCase().includes(searchReference.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      results = results.filter(item => item.category === selectedCategory);
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
    setEditableProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        prixVente: value,
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

  // const handleAddToCart = async (product) => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const decodedToken = token ? jwtDecode(token) : null;

  //     const userId = decodedToken?.userId || decodedToken?.commercialId;

  //     if (!product || !product._id) {
  //       throw new Error("Product is invalid");
  //     }

  //     // const total = product.prixVente;
  //     const prixVente = editableProducts[product._id]?.prixVente;
  //     const forfait = editableProducts[product._id]?.forfait || 0;

  //     const currentCart = JSON.parse(localStorage.getItem("panierItems")) || [];

  //     const res = await axios.get(`/panier/${id}`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     const allPanier = res.data;

  //     // const decodedToken = token ? jwtDecode(token) : null;
  //     const currentUserId = decodedToken?.userId;

  //     const filteredpanier = allPanier.filter(
  //       (panier) => panier.session === currentUserId
  //     );

  //     console.log("Backend cart data:", filteredpanier);

  //     const isAlreadyInCart =
  //       currentCart.some((item) => item.produit?._id === product._id) ||
  //       filteredpanier.some((item) => item.produit?._id === product._id);

  //     if (isAlreadyInCart) {
  //       message.warning("Produit déjà existant dans le panier");
  //       return;
  //     }

  //     // 2. Add to backend
  //     const response = await axios.post("/panier", {
  //       produitId: product._id,
  //       quantite: 1,
  //       leadId: id,
  //       total: parseFloat(prixVente),
  //       forfait: parseFloat(forfait) || undefined,
  //       session: userId,
  //     });
  //     console.log("responsesssss,", response);

  //     // 3. Update all states immediately
  //     const updatedCart = [...currentCart, response.data];

  //     // Update localStorage
  //     localStorage.setItem("panierItems", JSON.stringify(updatedCart));

  //     // Calculate new quantity
  //     const newQuantity = updatedCart.reduce(
  //       (sum, item) => sum + (item.quantite || 0),
  //       0
  //     );
  //     localStorage.setItem("cartQuantity", newQuantity.toString());

  //     // 4. Force immediate UI updates
  //     if (onCartChange) {
  //       onCartChange(newQuantity);
  //     }

  //     // 5. Notify all components
  //     window.dispatchEvent(new Event("storage"));

  //     message.success("Produit ajouté au panier");
  //   } catch (error) {
  //     console.error("Error adding to panier:", error);
  //     message.error("Échec de l'ajout au panier");
  //   }
  // };
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

      const currentCart = JSON.parse(localStorage.getItem("panierItems")) || [];

      // Check for duplicates considering user type
      const isAlreadyInCart =
        backendResponse.data.some(
          (item) =>
            item.produit?._id === product._id && item.userId.equals(userId) // Using equals for ObjectId comparison
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

  // const handleAddToCart = async (product) => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const decodedToken = token ? jwtDecode(token) : null;
  //     const userId = decodedToken?.userId || decodedToken?.commercialId;

  //     if (!product || !product._id) {
  //       throw new Error("Product is invalid");
  //     }

  //     // Get the edited values or fall back to original values
  //     const editedProduct = editableProducts[product._id] || {};
  //     const prixVente =
  //       editedProduct.prixVente !== undefined
  //         ? parseFloat(editedProduct.prixVente)
  //         : product.prixVente;

  //     const forfait =
  //       editedProduct.forfait !== undefined
  //         ? parseFloat(editedProduct.forfait)
  //         : product.forfait;

  //     if (!prixVente && prixVente !== 0) {
  //       message.error("Prix de vente est requis");
  //       return;
  //     }

  //     // 1. First check both localStorage AND make a quick API check
  //     const currentCart = JSON.parse(localStorage.getItem("panierItems")) || [];

  //     // Check with the backend
  //     const res = await axios.get(`/panier/${id}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     const allPanier = res.data;
  //     const currentUserId = decodedToken?.userId;
  //     const filteredpanier = allPanier.filter(
  //       (panier) => panier.session === currentUserId
  //     );

  //     const isAlreadyInCart =
  //       currentCart.some((item) => item.produit?._id === product._id) ||
  //       filteredpanier.some((item) => item.produit?._id === product._id);

  //     if (isAlreadyInCart) {
  //       message.warning("Produit déjà existant dans le panier");
  //       return;
  //     }

  //     // 2. Add to backend
  //     const response = await axios.post("/panier", {
  //       produitId: product._id,
  //       quantite: 1,
  //       leadId: id,
  //       total: prixVente,
  //       forfait: forfait || undefined, // Only send if exists
  //       session: userId,
  //     });

  //     // 3. Update all states immediately
  //     const updatedCart = [...currentCart, response.data];
  //     localStorage.setItem("panierItems", JSON.stringify(updatedCart));

  //     const newQuantity = updatedCart.reduce(
  //       (sum, item) => sum + (item.quantite || 0),
  //       0
  //     );
  //     localStorage.setItem("cartQuantity", newQuantity.toString());

  //     if (onCartChange) {
  //       onCartChange(newQuantity);
  //     }

  //     window.dispatchEvent(new Event("storage"));
  //     message.success("Produit ajouté au panier");
  //   } catch (error) {
  //     console.error("Error adding to panier:", error);
  //     message.error("Échec de l'ajout au panier");
  //   }
  // };

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
      render: (text, record) => (
        <Input
          type="number"
          defaultValue={text || ""}
          onChange={(e) => handleForfaitChange(e.target.value, record._id)}
          style={{ width: 100 }}
        />
      ),
      align: "right",
    },
    // {
    //   title: "Prix de vente",
    //   dataIndex: "prixVente",
    //   key: "prixVente",
    //   render: (text) => (text ? `${text}€` : "-"),
    //   align: "right",
    // },
    // {
    //   title: "Forfait",
    //   dataIndex: "forfait",
    //   key: "forfait",
    //   render: (text) => (text ? `${text}€` : "-"),
    //   align: "right",
    // },
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
  // return (
  //   <div style={{ padding: "20px" }}>
  //     <Table
  //       columns={[
  //         ...columns.map((col) => ({
  //           ...col,
  //           title: (
  //             <div className="flex flex-col items-center">
  //               <div className="text-xs">{col.title}</div>
  //             </div>
  //           ),
  //         })),
  //       ]}
  //       dataSource={produits} // Pass fetched products to the table
  //       pagination={false}
  //       rowKey="_id" // Use a unique key for each row (make sure _id is present in the fetched data)
  //     />
  //   </div>
  // );
  return (
    <div style={{ padding: "20px" }}>
      {/* Search and Filter Section */}
      <Card title="Recherche de Produits" style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="Rechercher par titre"
              allowClear
              onChange={e => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={8}>
            <Input
              placeholder="Rechercher par référence"
              allowClear
              onChange={e => setSearchReference(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={8}>
            <Select
              placeholder="Filtrer par catégorie"
              allowClear
              style={{ width: '100%' }}
              onChange={value => setSelectedCategory(value)}
              options={categories.map(cat => ({
                value: cat,
                label: cat
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
