import React from 'react';
import { Table, Input, Button, Space, Typography, Card, Tag, Menu, Dropdown } from 'antd';
import { SearchOutlined, PlusOutlined, FilterOutlined, ExclamationCircleOutlined, MoreOutlined   } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
const { Title } = Typography;
const { Search } = Input;

const Fournisseurs = () => {
    const isMobile = useMediaQuery({ maxWidth: 768 });
    const isSmallMobile = useMediaQuery({ maxWidth: 480 });
  
    const menu = (
      <Menu>
        <Menu.Item key="1" icon={<PlusOutlined />}>
          Ajouter un fournisseur
        </Menu.Item>
        <Menu.Item key="2" icon={<FilterOutlined />}>
          Filtres
        </Menu.Item>
      </Menu>
    );


  const dataSource = [
    {
      key: '1',
      nom: 'Fournisseur A',
      contact: 'Jean Dupont',
      email: 'contact@fournisseura.com',
      telephone: '01 23 45 67 89',
      statut: 'actif',
      commandes: 12,
    },
    {
      key: '2',
      nom: 'Fournisseur B',
      contact: 'Marie Martin',
      email: 'contact@fournisseurb.com',
      telephone: '01 98 76 54 32',
      statut: 'inactif',
      commandes: 5,
    },
    // Add more suppliers as needed
  ];

  const columns = [
    {
      title: 'Nom',
      dataIndex: 'nom',
      key: 'nom',
    },
    {
      title: 'Contact',
      dataIndex: 'contact',
      key: 'contact',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Téléphone',
      dataIndex: 'telephone',
      key: 'telephone',
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (statut) => (
        <Tag color={statut === 'actif' ? 'green' : 'red'}>
          {statut.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Commandes',
      dataIndex: 'commandes',
      key: 'commandes',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link">Voir</Button>
          <Button type="link">Modifier</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="fournisseurs-page">
      {/* <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Title level={2} style={{ marginBottom: 0 }}>Gestion des Fournisseurs</Title>
        <Tag icon={<ExclamationCircleOutlined />} color="orange">
          En cours de développement
        </Tag>
      </div> */}
      <div style={{ 
  display: 'flex', 
  flexDirection: 'row', 
  alignItems: 'center', 
  gap: '12px', 
  marginBottom: '16px',
  flexWrap: 'wrap' 
}}>
  <Title 
    level={2} 
    style={{ 
      marginBottom: 0,
      fontSize: 'clamp(1.2rem, 4vw, 1.8rem)' // Responsive font size
    }}
  >
    Gestion des Fournisseurs
  </Title>
  <Tag 
    icon={<ExclamationCircleOutlined />} 
    color="orange"
    style={{
      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' // Responsive font size for tag
    }}
  >
    En cours de développement
  </Tag>
</div>
      
      <Card>
        {/* <div className="toolbar" style={{ marginBottom: 16 }}>
          <Space size="large">
            <Search
              placeholder="Rechercher un fournisseur..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              style={{ width: 300 }}
            />
            
            <Button type="primary" icon={<PlusOutlined />}>
              Ajouter un fournisseur
            </Button>
            
            <Button icon={<FilterOutlined />}>
              Filtres
            </Button>
          </Space>
        </div> */}
        <div className="toolbar" style={{ marginBottom: 16 }}>
          {isMobile ? (
            <Space size="middle" direction={isSmallMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
              <Search
                placeholder="Rechercher..."
                allowClear
                enterButton={isSmallMobile ? <SearchOutlined /> : "Rechercher"}
                size="large"
                style={{ width: isSmallMobile ? '100%' : 200 }}
              />
              
              {isSmallMobile ? (
                <Dropdown overlay={menu} placement="bottomRight">
                  <Button type="text" icon={<MoreOutlined />} size="large" />
                </Dropdown>
              ) : (
                <Space>
                  <Button type="primary" icon={<PlusOutlined />} size="large">
                    Ajouter
                  </Button>
                  <Button icon={<FilterOutlined />} size="large">
                    Filtres
                  </Button>
                </Space>
              )}
            </Space>
          ) : (
            <Space size="large">
              <Search
                placeholder="Rechercher un fournisseur..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                style={{ width: 300 }}
              />
              <Button type="primary" icon={<PlusOutlined />}>
                Ajouter un fournisseur
              </Button>
              <Button icon={<FilterOutlined />}>
                Filtres
              </Button>
            </Space>
          )}
        </div>
        
        <Table 
          dataSource={dataSource} 
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
          bordered
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default Fournisseurs;