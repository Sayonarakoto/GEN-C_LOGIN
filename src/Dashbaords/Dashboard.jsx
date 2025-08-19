import { Layout, Menu } from "antd";
import { UserOutlined, DashboardOutlined } from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

function Dashboard() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider>
        <div style={{ height: "32px", margin: "16px", background: "rgba(255,255,255,.2)" }} />
        <Menu theme="dark" mode="inline" defaultSelectedKeys={["1"]}>
          <Menu.Item key="1" icon={<DashboardOutlined />}>
            Dashboard
          </Menu.Item>
          <Menu.Item key="2" icon={<UserOutlined />}>
            Profile
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", padding: 0, textAlign: "center" }}>
          <h2>My Dashboard</h2>
        </Header>
        <Content style={{ margin: "16px" }}>
          <div style={{ padding: 24, minHeight: 360, background: "#fff" }}>
            Welcome to your dashboard!
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default Dashboard;
