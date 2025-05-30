import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout, Typography } from 'antd';
import HomePage from './pages/HomePage';
import GeneratorPage from './pages/GeneratorPage';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  return (
    <div className="app-container">
      <Layout>
        <Header style={{ 
          background: '#fff', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            🚀 智能软件著作权生成器
          </Title>
        </Header>
        
        <Content className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/generator" element={<GeneratorPage />} />
          </Routes>
        </Content>
        
        <Footer style={{ 
          textAlign: 'center', 
          background: '#f0f2f5',
          borderTop: '1px solid #d9d9d9'
        }}>
          <div>
            智能软件著作权生成器 ©2024 厦门佰能思维人工智能科技有限公司
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            基于AI技术的软著申请文档自动生成工具
          </div>
        </Footer>
      </Layout>
    </div>
  );
}

export default App; 