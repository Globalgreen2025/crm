// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { Table, Button, Tag, message, Space } from "antd";
// import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
// import { Link, useNavigate } from "react-router-dom";

// const Programmes = () => {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const response = await axios.get("/produit");
//         setProducts(response.data);
//       } catch (error) {
//         message.error("Failed to fetch products.");
//         console.error(error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProducts();
//   }, []);

//   const handleCreateNewProduct = () => {
//     navigate("/create-produit");
//   };

//   const handleDeleteProduct = async (productId) => {
//     try {
//       await axios.delete(`/produit/${productId}`);
//       setProducts(products.filter(product => product._id !== productId));
//       message.success("Produit supprimé avec succès !");
//     } catch (error) {
//       message.error("Failed to delete product.");
//       console.error(error);
//     }
//   };

//   const columns = [
//     {
//       title: 'Catégorie',
//       dataIndex: 'category',
//       key: 'category',
//       render: (category) => (
//         <Tag color="blue" key={category}>
//           {category}
//         </Tag>
//       ),
//     },
//     {
//       title: 'Référence',
//       dataIndex: 'reference',
//       key: 'reference',
//     },
//     {
//       title: 'Titre',
//       dataIndex: 'title',
//       key: 'title',
//     },
//     {
//       title: 'Description',
//       dataIndex: 'description',
//       key: 'description',
//       render: (text) => (
//         <div style={{ 
//           whiteSpace: 'pre-line',
//           maxHeight: '100px',
//           padding: '8px 0'
//         }}>
//           {text}
//         </div>
//       ),
//     },
//     {
//       title: "Prix de vente",
//       dataIndex: "prixVente",
//       key: "prixVente",
//     },
//     {
//       title: 'TVA',
//       dataIndex: 'tva',
//       key: 'tva',
//       render: (tva) => `${tva}%`,
//       align: 'right',
//     },
//     {
//       title: 'Date création',
//       dataIndex: 'createdAt',
//       key: 'createdAt',
//       render: (date) => new Date(date).toLocaleDateString(),
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space size="middle">
//           <Link to={`/create-produit/${record._id}`}>
//             <Button icon={<EditOutlined />} type="primary" />
//           </Link>
//           <Button
//             icon={<DeleteOutlined />}
//             danger
//             onClick={() => handleDeleteProduct(record._id)}
//           />
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold">Produits</h1>
//         <Button
//           type="primary"
//           icon={<PlusOutlined />}
//           className="bg-purple-800 text-white"
//           onClick={handleCreateNewProduct}
//         >
//           Ajouter produit
//         </Button>
//       </div>

//       <Table
//           columns={[
//             ...columns.map((col) => ({
//               ...col,
//               title: (
//                 <div className="flex flex-col items-center">
//                   <div className="text-xs">{col.title}</div>
//                 </div>
//               ),
//             })),
//           ]}
//         dataSource={products}
//         rowKey="_id"
//         loading={loading}
//         bordered
//         scroll={{ x: true }}
//         pagination={{
//           pageSize: 10,
//           showSizeChanger: true,
//           pageSizeOptions: ['10', '20', '50'],
//           // showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} produits`,
//         }}
//       />
//     </div>
//   );
// };

// export default Programmes;
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Tag, message, Space, Card, Col, Row, Select, Input  } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

const Programmes = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [searchReference, setSearchReference] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
     const [filteredProduits, setFilteredProduits] = useState([]);
     const [categories, setCategories] = useState([]);

     useEffect(() => {
        // Filter products based on search criteria
        let results = products;
    
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
      }, [searchText, searchReference, selectedCategory, products]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("/produit");
        // Trier les produits par date de création décroissante (les plus récents en premier)
        const sortedProducts = response.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setProducts(sortedProducts);
        setFilteredProduits(sortedProducts);
        const uniqueCategories = [
          ...new Set(sortedProducts.map((p) => p.category)),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        message.error("Failed to fetch products.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleCreateNewProduct = () => {
    navigate("/create-produit");
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await axios.delete(`/produit/${productId}`);
      setProducts(products.filter(product => product._id !== productId));
      message.success("Produit supprimé avec succès !");
    } catch (error) {
      message.error("Failed to delete product.");
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Catégorie',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="blue" key={category}>
          {category}
        </Tag>
      ),
    },
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
    },
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
    },
    // {
    //   title: 'Description',
    //   dataIndex: 'description',
    //   key: 'description',
    //   render: (text) => (
    //     <div style={{ 
    //       whiteSpace: 'pre-line',
    //       maxHeight: '100px',
    //       overflowY: 'auto',
    //       padding: '8px 0',
    //       lineHeight: '1.4'
    //     }}>
    //       {text}
    //     </div>
    //   ),
    // },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => {
        if (!text) return '-';
        
        // Diviser le texte en lignes
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        return (
          <div style={{ 
            maxHeight: '100px',
            overflowY: 'auto',
            padding: '8px 0',
            lineHeight: '1.4'
          }}>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '16px',
              listStyleType: 'none'
            }}>
              {lines.map((line, index) => {
                const isLastLine = index === lines.length - 1;
                return (
                  <li key={index} style={{ position: 'relative' }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: '-12px' 
                    }}>•</span>
                    {line}{isLastLine ? '.' : ''}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      },
    },
    {
      title: "Prix de vente",
      dataIndex: "prixVente",
      key: "prixVente",
      render: (prix) => `${prix} €`,
      align: 'right',
    },
    {
      title: 'TVA',
      dataIndex: 'TVA', // Changé de 'tva' à 'TVA' pour correspondre à votre backend
      key: 'TVA',
      render: (tva) => tva ? `${tva}%` : '-',
      align: 'right',
    },
    {
      title: 'Date création',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('fr-FR'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/create-produit/${record._id}`}>
            <Button icon={<EditOutlined />} type="primary" />
          </Link>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteProduct(record._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Produits</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="bg-purple-800 text-white"
          onClick={handleCreateNewProduct}
        >
          Ajouter produit
        </Button>
      </div>
      <Card title="Recherche de Produits" style={{ marginBottom: 20 }}>
        <Row gutter={16}>
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
          <Col span={8}>
            <Input
              placeholder="Rechercher par référence"
              allowClear
              onChange={(e) => setSearchReference(e.target.value)}
              style={{ width: "100%" }}
            />
          </Col>
          <Col span={8}>
            <Input
              placeholder="Rechercher par titre"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%" }}
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
        rowKey="_id"
        loading={loading}
        bordered
        scroll={{ x: true }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
      />
    </div>
  );
};

export default Programmes;