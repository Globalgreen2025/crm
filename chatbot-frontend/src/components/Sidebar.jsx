import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faUserTie,
  faCaretLeft,
  faUserTag,
  faThLarge,
  faSignOutAlt,
  faFileContract,
  faChartBar,
  faFilePdf,
  faCalendarAlt,
  faCog,
  faTicket,
  faFileImport,
  faTruck 
} from "@fortawesome/free-solid-svg-icons";
import { UserOutlined } from "@ant-design/icons";
import { Layout, Menu, Divider, Avatar } from "antd";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { UserContext } from "../UserContext";
import { ToggleContext } from "./store/ToggleContext";
import logo from "../assets/logo.jpeg";

const { Sider } = Layout;
const { SubMenu } = Menu;

const SideBar = () => {
  const token = localStorage.getItem("token");
  const decodedToken = token ? jwtDecode(token) : "";
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useContext(UserContext);
  const [profileVisible, setProfileVisible] = useState(false);
  const [profileImage, setProfileImage] = useState("");

  const { collapsed, onClickHandler } = useContext(ToggleContext);

  const showProfile = () => setProfileVisible(true);

  const Logout = async () => {
    await axios.post("/logout");
    setToken(null);
    navigate("/SignIn");
  };
  const handleSettingsClick = () => {
    navigate("/Paramètres");
  };

  const getInitials = (name) => {
    const names = name?.split(" ");
    const initials = names?.map((n) => n[0]).join("");
    return initials?.toUpperCase();
  };

  const items = [
    {
      key: "/",
      icon: (
        <FontAwesomeIcon
          icon={faHome}
          style={{ fontSize: "20px", marginRight: "10px" }}
        />
      ),
      label: "Dashboard",
      role: ["Admin", "Manager"],
    },
    {
      key: "entreprise",
      icon: (
        <FontAwesomeIcon
          icon={faChartBar}
          style={{ fontSize: "20px", marginRight: "10px" }}
        />
      ),
      label: "Entreprise",
      // role: "Admin",
      children: [
        {
          key: "/leads",
          icon: (
            <FontAwesomeIcon
              icon={faUserTie}
              style={{ fontSize: "12px", marginRight: "8px" }}
            />
          ),
          label: "Mes clients",
          role: ["Admin", "Manager"],
        },
        {
          key: "/fournisseurs",
          icon: (
            <FontAwesomeIcon
              icon={faTruck}
              style={{ fontSize: "12px", marginRight: "8px" }}
            />
          ),
          label: "Mes fournisseurs",
          role: ["Admin", "Manager"],
        },
        {
          key: "/import-leads",
          icon: (
            <FontAwesomeIcon
              icon={faFileImport}
              style={{ fontSize: "12px", marginRight: "8px" }}
            />
          ),
          label: "Importer Leads",
          role: ["Admin", "Manager"],
        },
        {
          label: "Affectation Leads",
          role: ["Admin", "Manager"],
          key: "/affect-leads",
          icon: (
            <FontAwesomeIcon
              icon={faUserTag}
              style={{ fontSize: "12px", marginRight: "8px" }}
            />
          ),
        },
      ]
    },
    
    {
      key: "/list-leads",
      icon: (
        <FontAwesomeIcon
          icon={faUserTie}
          style={{ fontSize: "20px", marginRight: "10px" }}
        />
      ),
      label: "Mes clients",
      role: "Commercial",
    },
    
    {
      key: "/produits",
      icon: (
        <FontAwesomeIcon
          icon={faThLarge}
          style={{ fontSize: "20px", marginRight: "10px" }}
        />
      ),
      label: "Produits",
      role: ["Admin", "Manager"],
    },
   
    {
      key: "/CalendrierCommerciale", // Update the key if necessary
      icon: (
        <FontAwesomeIcon
          icon={faCalendarAlt}
          style={{ fontSize: "20px", marginRight: "10px" }}
        />
      ),
      label: "Calendrier",
      role: ["Commercial", "Admin"],
    },
    {
      key: "/tickets",
      icon: (
        <FontAwesomeIcon
          icon={faTicket}
          style={{ fontSize: "20px", marginRight: "10px" }}
        />
      ),
      label: "Mes Réclamations",
      role: ["Admin", "Commercial"],
    },
    {
      key: "",
      icon: (
        <FontAwesomeIcon
          icon={faChartBar}
          style={{ fontSize: "20px", marginRight: "10px" }}
        />
      ),
      label: "Suivi des ventes",
      // role: "Admin",
      children: [
        {
          key: "/Devis",
          icon: (
            <FontAwesomeIcon
              icon={faFileContract}
              style={{ fontSize: "12px", marginRight: "8px" }}
            />
          ),
          label: "Devis",
          role: ["Admin", "Commercial"],
        },
        {
          key: "/Contrats",
          icon: (
            <FontAwesomeIcon
              icon={faFileContract}
              style={{ fontSize: "12px", marginRight: "8px" }}
            />
          ),
          label: "Contrat",
          role: ["Admin", "Commercial"],
        },
      ],
    },
    {
      key: "Paramètres",
      icon: (
        <FontAwesomeIcon
          icon={faCog}
          style={{ fontSize: "20px", marginRight: "10px" }}
        />
      ),
      label: "Paramètres",
      role: "Admin",
      onClick: handleSettingsClick,
    },
  ];

  const hasAccess = (roleSetting, userRole) => {
    if (!roleSetting) return true;
    return Array.isArray(roleSetting)
      ? roleSetting.includes(userRole)
      : roleSetting === userRole;
  };
  const filteredItems = items
    .map((item) => {
      // Admin sees everything
      // if (decodedToken.role === "Admin") return item;
      if (item.children) {
        const filteredChildren = item.children.filter((child) =>
          hasAccess(child.role, decodedToken.role)
        );

        if (filteredChildren.length > 0) {
          return { ...item, children: filteredChildren };
        }

        return null; // No visible children, hide the item
      }

      return hasAccess(item.role, decodedToken.role) ? item : null;
    })
    .filter(Boolean);

  const toggleSidebar = () => {
    if (!decodedToken) {
      // Set sidebar to collapsed if token is missing (not logged in)
      onClickHandler(true);
    } else {
      // Set sidebar to expanded if token exists
      onClickHandler(false);
    }
  };

  useEffect(() => {
    toggleSidebar();
  }, []);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path);

//   return (
 
//     <Sider
//   trigger={null}
//   collapsible
//   collapsed={collapsed}
//   className="bg-white w-full flex flex-col"
//   width={240}
//   style={{
//     display: 'flex',
//     flexDirection: 'column',
//     height: '100vh',
//     position: 'relative'
//   }}
// >
//       <div
//         className="absolute top-4 right-0 cursor-pointer text-purple-900 text-4xl"
//         onClick={onClickHandler}
//       >
//         <FontAwesomeIcon icon={faCaretLeft} />
//       </div>

//       {/* Profile Section - Always Visible Avatar */}
//       <div
//         className={`flex items-center space-x-2 px-7 py-4 ${
//           collapsed ? "justify-start pl-1" : ""
//         }`}
//       >
//         <Avatar
//           src={profileImage}
//           className="bg-purple-900 text-white text-lg rounded-md font-bold cursor-pointer hover:shadow-lg transition-all duration-300"
//           size={40}
//         >
//           {!profileImage &&
//             (decodedToken ? getInitials(decodedToken.name) : <UserOutlined />)}
//         </Avatar>
//         {!collapsed && (
//           <div
//             className="text-gray-800 text-md font-medium cursor-pointer hover:text-blue-600"
//             onClick={showProfile}
//           >
//             <div>{decodedToken?.name}</div>
//             <div className="text-sm text-gray-500">{decodedToken?.role}</div>
//           </div>
//         )}
//       </div>
//       <div style={{ 
//   flex: 1, 
//   overflowY: 'auto', 
//   paddingBottom: '120px' // Space for footer
// }}>

//       {/* Sidebar Menu - Main Items */}
//       <Menu
//         className="font-bold text-gray-600 mt-2 w-full flex-grow"
//         theme="white"
//         mode="inline"
//         selectedKeys={[location.pathname]}
//         onClick={({ key }) => navigate(key)}
//       >
//         {filteredItems.map((item) =>
//           item.children ? (
//             <SubMenu key={item.key} icon={item.icon} title={item.label}>
//               {item.children.map((child) => (
//                 <Menu.Item
//                   key={child.key}
//                   icon={child.icon}
//                   className={
//                     isActive(child.key)
//                       ? "bg-white text-gray-600"
//                       : "hover:bg-purple-900 hover:text-white"
//                   }
//                 >
//                   {child.label}
//                 </Menu.Item>
//               ))}
//             </SubMenu>
//           ) : (
//             <Menu.Item
//               key={item.key}
//               icon={item.icon}
//               className={
//                 isActive(item.key)
//                   ? "bg-white text-gray-600"
//                   : "hover:bg-purple-900 hover:text-white"
//               }
//             >
//               {item.label}
//             </Menu.Item>
//           )
//         )}
//       </Menu>
//       </div>
//       {/* <Divider className="h-[2px] mt-12" style={{ backgroundColor: "#D1D5DB" }} /> */}

//       <div 
//       style={{
//         position: 'sticky',
//         bottom: 0,
//         background: 'white',
//         zIndex: 1,
//         padding: '16px 0',
//         borderTop: '1px solid #D1D5DB',
//         width: '100%'
//       }}
//     >
//       <Menu
//         className="font-bold mt-6 bg-white text-gray-600 border-r-0"
//         mode="inline"
//         selectedKeys={[location.pathname]}
//         theme="white"
//         style={{ borderRight: 0 }}
//       >
//         <Menu.Item
//           key="logout"
//           icon={
//             <FontAwesomeIcon
//               icon={faSignOutAlt}
//               style={{ fontSize: "23px" }}
//             />
//           }
//           onClick={Logout}
//         >
//           {"Se déconnecter"}
//         </Menu.Item>
//       </Menu>
//       <div className="flex justify-start mt-2 py-4 ml-6">
//         <img 
//           src={logo} 
//           alt="Logo" 
//           className={`${collapsed ? "w-4" : "w-16"} transition-all rounded-full duration-300`} 
//         />
//       </div>
//     </div>

//     </Sider>
//   );

return (
  <Sider
    trigger={null}
    collapsible
    collapsed={collapsed}
    className="bg-white w-full flex flex-col"
    width={240}
    style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden' // Add this to contain all elements
    }}
  >
    {/* Collapse Button */}
    <div
      className="cursor-pointer text-purple-900 text-4xl px-4 py-4 absolute top-0 right-0 z-10"
      onClick={onClickHandler}
    >
      <FontAwesomeIcon icon={faCaretLeft} />
    </div>

    {/* Profile Section - Fixed Header */}
    <div 
      className=" bg-white z-10"
      style={{
       
        borderBottom: '1px solid #f0f0f0'
      }}
    >
    <div
        className={`flex items-center space-x-2 px-7 py-4 ${
          collapsed ? "justify-start pl-1" : ""
        }`}
      >
        <Avatar
          src={profileImage}
          className="bg-purple-900 text-white text-lg rounded-md font-bold cursor-pointer hover:shadow-lg transition-all duration-300"
          size={40}
        >
          {!profileImage &&
            (decodedToken ? getInitials(decodedToken.name) : <UserOutlined />)}
        </Avatar>
        {!collapsed && (
          <div
            className="text-gray-800 text-md font-medium cursor-pointer hover:text-blue-600"
            onClick={showProfile}
          >
            <div>{decodedToken?.name}</div>
            <div className="text-sm text-gray-500">{decodedToken?.role}</div>
          </div>
        )}
      </div>
    </div>

    {/* Scrollable Menu Area */}
    <div style={{ 
      flex: 1, 
      overflowY: 'auto', 
      paddingBottom: '120px', // Space for footer
      width: '100%'
    }}>
      <Menu
        className="font-bold text-gray-600 w-full border-r-0"
        theme="white"
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0 }}
      >
        {filteredItems.map((item) =>
          item.children ? (
            <SubMenu 
              key={item.key} 
              icon={item.icon} 
              title={item.label}
              popupClassName="sidebar-submenu"
            >
              {item.children.map((child) => (
                <Menu.Item
                  key={child.key}
                  icon={child.icon}
                  className={
                    isActive(child.key)
                      ? "bg-white text-gray-600"
                      : "hover:bg-purple-900 hover:text-white"
                  }
                >
                  {child.label}
                </Menu.Item>
              ))}
            </SubMenu>
          ) : (
            <Menu.Item
              key={item.key}
              icon={item.icon}
              className={
                isActive(item.key)
                  ? "bg-white text-gray-600"
                  : "hover:bg-purple-900 hover:text-white"
              }
            >
              {item.label}
            </Menu.Item>
          )
        )}
      </Menu>
    </div>
{/* Fixed Footer Section */}
<div 
  style={{
    position: 'sticky',
    bottom: 0,
    background: 'white',
    zIndex: 10, // Higher than menu content
    padding: '8px 0', // Reduced padding
    borderTop: '1px solid #D1D5DB',
    width: '100%',
    height: 'auto', // Auto height
    minHeight: '80px' // Set minimum height
  }}
>
  <Menu
    className="font-bold bg-white text-gray-600 border-r-0"
    mode="inline"
    selectedKeys={[location.pathname]}
    theme="white"
    style={{ 
      borderRight: 0,
      lineHeight: '1.2' // Tighter line spacing
    }}
  >
    <Menu.Item
      key="logout"
      icon={
        <FontAwesomeIcon
          icon={faSignOutAlt}
          style={{ fontSize: "18px" }} // Smaller icon
        />
      }
      onClick={Logout}
      style={{
        paddingTop: '4px',
        paddingBottom: '4px',
        height: '32px' // Smaller item height
      }}
    >
      {"Se déconnecter"}
    </Menu.Item>
  </Menu>
  <div className="flex justify-start mt-2 py-4 ml-6">
        <img 
          src={logo} 
          alt="Logo" 
          className={`${collapsed ? "w-4" : "w-12"} transition-all rounded-full duration-300`} 
        />
      </div>
</div>
  </Sider>
);
};

export default SideBar;
