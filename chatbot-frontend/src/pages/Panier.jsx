import React, { useState, useEffect } from "react";
import { Table, Button, Input, message, Tooltip, Tag, Select } from "antd";
import axios from "axios";
import {
  DeleteOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Panier = ({ setCartQuantity, refreshTrigger }) => {
  const { id } = useParams();
  const [panierItems, setPanierItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cartFromStorage =
      JSON.parse(localStorage.getItem("panierItems")) || [];
    setPanierItems(cartFromStorage);
    updateCartQuantity(cartFromStorage);
  }, [refreshTrigger]);

  useEffect(() => {
    const fetchCartData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        // Always get fresh data from backend first
        const response = await axios.get(`/panier/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const allPanier = response.data;
        console.log("allPanier", allPanier);

        const decodedToken = token ? jwtDecode(token) : null;
        const currentUserId = decodedToken?.userId;
        console.log("currentUserId", currentUserId);

        const filteredpanier = allPanier.filter(
          (panier) => panier.userId === currentUserId
        );
        console.log("filteredpanier", filteredpanier);
        setPanierItems(filteredpanier);

        // Calculate and update quantity
        const totalQuantity = filteredpanier.reduce(
          (acc, item) => acc + item.quantite,
          0
        );
        setCartQuantity(totalQuantity);

        // Sync with localStorage
        localStorage.setItem("panierItems", JSON.stringify(filteredpanier));
        localStorage.setItem("cartQuantity", totalQuantity.toString());
      } catch (error) {
        // Fallback to localStorage if API fails
        const localCart = JSON.parse(localStorage.getItem("panierItems")) || [];
        setPanierItems(localCart);
        const localQuantity = localCart.reduce(
          (sum, item) => sum + (item.quantite || 0),
          0
        );
        setCartQuantity(localQuantity);
      }
    };

    fetchCartData();
  }, [refreshTrigger, setCartQuantity]);

  // Update cart quantity
  const updateCartQuantity = (items) => {
    const totalQuantity = items.reduce((acc, item) => acc + item.quantite, 0);
    setCartQuantity(totalQuantity);
  };

 
  // const handleQuantityChange = async (panierId, newQuantity) => {
  //   const token = localStorage.getItem("token");
  //   try {
  //     // 1. Update backend
  //     const response = await axios.put(`/panier/${panierId}`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //       quantite: newQuantity,
  //     });
  
  //     // 2. Update local state with proper calculations
  //     const updatedItems = panierItems.map((item) => {
  //       if (item._id === panierId) {
  //         const unitPrice = item.total; // Use the base price
  //         // const forfait = item.forfait || 0;
  //         const baseHT = parseFloat(unitPrice);
  //         const montantHT = parseFloat((baseHT * newQuantity).toFixed(2));
  //         const montantTVA = parseFloat((montantHT * (item.TVAappliquée / 100)).toFixed(2));
  //         const montantTTC = parseFloat((montantHT + montantTVA).toFixed(2));
          
  //         return {
  //           ...item,
  //           quantite: newQuantity,
  //           montantHT,
  //           montantTVA,
  //           montantTTC,
  //         };
  //       }
  //       return item;
  //     });
  
  //     const filteredItems = updatedItems.filter((item) => item.quantite > 0);
  //     setPanierItems(filteredItems);
  
  //     // 3. Update totals
  //     const totalQuantity = filteredItems.reduce(
  //       (sum, item) => sum + item.quantite,
  //       0
  //     );
  
  //     setCartQuantity(totalQuantity);
  //     localStorage.setItem("panierItems", JSON.stringify(filteredItems));
  //     localStorage.setItem("cartQuantity", totalQuantity.toString());
  
  //     window.dispatchEvent(new Event("storage"));
  //     message.success("Quantité mise à jour");
  //   } catch (error) {
  //     console.error("Error updating quantity:", error);
  //     message.error("Failed to update quantity");
  
  //     const localCart = JSON.parse(localStorage.getItem("panierItems")) || [];
  //     setPanierItems(localCart);
  //     setCartQuantity(localCart.reduce((sum, item) => sum + item.quantite, 0));
  //   }
  // };
  const handleQuantityChange = async (panierId, newQuantity) => {
    const token = localStorage.getItem("token");
    try {
      // 1. Update backend - FIXED: Proper axios put syntax
      const response = await axios.put(
        `/panier/${panierId}`,
        { quantite: newQuantity }, // Data goes here
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // 2. Update local state with proper calculations - FIXED: TTC to HT conversion
      const updatedItems = panierItems.map((item) => {
        if (item._id === panierId) {
          const unitPriceTTC = item.total; // This is TTC price per unit
          const TVArate = item.TVAappliquée / 100;
          
          // Convert unit price from TTC to HT
          const unitPriceHT = unitPriceTTC / (1 + TVArate);
          
          // Calculate amounts based on quantity
          const montantHT = parseFloat((unitPriceHT * newQuantity).toFixed(2));
          const montantTVA = parseFloat((montantHT * TVArate).toFixed(2));
          const montantTTC = parseFloat((montantHT + montantTVA).toFixed(2));
          
          return {
            ...item,
            quantite: newQuantity,
            montantHT,
            montantTVA,
            montantTTC,
          };
        }
        return item;
      });
  
      const filteredItems = updatedItems.filter((item) => item.quantite > 0);
      setPanierItems(filteredItems);
  
      // 3. Update totals
      const totalQuantity = filteredItems.reduce(
        (sum, item) => sum + item.quantite,
        0
      );
  
      setCartQuantity(totalQuantity);
      localStorage.setItem("panierItems", JSON.stringify(filteredItems));
      localStorage.setItem("cartQuantity", totalQuantity.toString());
  
      window.dispatchEvent(new Event("storage"));
      message.success("Quantité mise à jour");
    } catch (error) {
      console.error("Error updating quantity:", error);
      message.error("Failed to update quantity");
  
      const localCart = JSON.parse(localStorage.getItem("panierItems")) || [];
      setPanierItems(localCart);
      setCartQuantity(localCart.reduce((sum, item) => sum + item.quantite, 0));
    }
  };
  const handleRemoveFromCart = async (panierId) => {
    try {
      // 1. Delete from backend
      await axios.delete(`/panier/${panierId}`);

      // 2. Update local state
      const updatedItems = panierItems.filter((item) => item._id !== panierId);
      setPanierItems(updatedItems);

      // 3. Calculate new quantity
      const totalQuantity = updatedItems.reduce(
        (sum, item) => sum + item.quantite,
        0
      );

      // 4. Update all states and storage
      setCartQuantity(totalQuantity);
      localStorage.setItem("panierItems", JSON.stringify(updatedItems));
      localStorage.setItem("cartQuantity", totalQuantity.toString());

      // 5. Notify other tabs
      window.dispatchEvent(new Event("storage"));

      message.success("Produit supprimé du panier");
    } catch (error) {
      console.error("Error removing product:", error);
      message.error("Failed to remove product.");

      // Optional: Revert to previous state
      const localCart = JSON.parse(localStorage.getItem("panierItems")) || [];
      setPanierItems(localCart);
      setCartQuantity(localCart.reduce((sum, item) => sum + item.quantite, 0));
    }
  };

  const calculateTotals = () => {
    const totals = panierItems.reduce((acc, item) => {
      return {
        totalHT: acc.totalHT + (item.montantHT || 0),
        totalTVA: acc.totalTVA + (item.montantTVA || 0),
        totalTTC: acc.totalTTC + (item.montantTTC || 0),
      };
    }, { totalHT: 0, totalTVA: 0, totalTTC: 0 });
  
    return {
      totalHT: parseFloat(totals.totalHT.toFixed(2)),
      totalTVA: parseFloat(totals.totalTVA.toFixed(2)),
      totalTTC: parseFloat(totals.totalTTC.toFixed(2)),
    };
  };

  const { totalHT, totalTVA, totalTTC } = calculateTotals();

  const handlePasserLaCommande = () => {
    navigate(`/leads/${id}/create-command`);
  };

  const columns = [
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
    },
    {
      title: "Catégorie",
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
      title: "Quantité",
      key: "quantite",
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Input
            type="number"
            min={1}
            value={record.quantite}
            style={{ width: 70 }}
            size="small"
            onChange={async (e) => {
              try {
                const newQuantity = parseInt(e.target.value) || 1;
                if (newQuantity >= 1) {
                  await handleQuantityChange(record._id, newQuantity);
                }
              } catch (error) {
                console.error("Quantity change error:", error);
              }
            }}
            onBlur={async (e) => {
              try {
                const newQuantity = parseInt(e.target.value) || 1;
                if (newQuantity < 1) {
                  await handleQuantityChange(record._id, 1);
                }
              } catch (error) {
                console.error("Quantity change error:", error);
              }
            }}
          />
    
        </div>
      ),
    },
    {
      title: "Unités",
      key: "unite",
      render: (_, record) => (
        <span>{record.unite}</span>
      ),
    },

    {
      title: "Forfait",
      dataIndex: "forfait",
      key: "forfait",
      render: (value) => `${parseFloat(value || 0).toFixed(2)} €`,
    },
    {
      title: "Montant HT",
      dataIndex: "montantHT",
      key: "montantHT",
      render: (value) => `${parseFloat(value || 0).toFixed(2)} €`,
    },
    {
      title: "TVA",
      dataIndex: "montantTVA",
      key: "montantTVA",
      render: (value, record) => `${parseFloat(value || 0).toFixed(2)} € (${record.TVAappliquée}%)`,
    },
    {
      title: "Montant TTC",
      dataIndex: "montantTTC",
      key: "montantTTC",
      render: (value) => `${parseFloat(value || 0).toFixed(2)} €`,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Tooltip title="Supprimer">
          <DeleteOutlined
            style={{ color: "red", cursor: "pointer" }}
            onClick={() => handleRemoveFromCart(record._id)} // Remove product from the cart
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
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
        dataSource={panierItems}
        pagination={false}
        // rowKey={(record) => record.produit._id}
        rowKey={(record) => record._id || record.produit?._id || Math.random()}
      />

      <div style={{ marginTop: "20px", textAlign: "right" }}>
        <h3>Total HT: {totalHT.toFixed(2)} €</h3>
        <h3>Total TVA: {totalTVA.toFixed(2)} €</h3>
        <h3>Total TTC: {totalTTC.toFixed(2)} €</h3>
        <div className="mt-4">
          <Button
            type="primary"
            style={{
              marginLeft: "10px",
              backgroundColor: "green",
              borderColor: "green",
            }}
            onClick={handlePasserLaCommande}
          >
            Passer la commande
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Panier;
